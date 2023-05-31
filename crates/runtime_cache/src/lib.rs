use anyhow::{anyhow, Result};
use cuid::cuid2;
use rand::Rng;
use redis::AsyncCommands;
use serde::{Deserialize, Serialize};
use serde_json;
use sqlx::{
    mysql::{MySqlPoolOptions, MySqlRow},
    MySql, Pool, Row,
};
use std::env;
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Serialize, Deserialize, Debug, PartialEq)]
pub struct CachePutRequest {
    pub cache_id: String,
    pub request_url: String,
    pub request_headers: Vec<u8>,
    pub response_headers: Vec<u8>,
    pub response_body: Vec<u8>,
    pub response_status: u16,
    pub response_status_text: String,
}

#[derive(Debug)]
pub struct CacheMatchRequest {
    pub cache_id: String,
    pub request_url: String,
}

pub struct BackedCache {
    pub mysql_pool: Pool<MySql>,
    pub redis_conn: Arc<Mutex<redis::aio::Connection>>,
}

impl BackedCache {
    pub async fn new() -> Self {
        let mysql_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
        let mysql_pool = MySqlPoolOptions::new()
            .max_connections(10)
            .connect(mysql_url.as_str())
            .await
            .expect("failed to conn pool");

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS `CacheStorage` (
                `id` VARCHAR(191) NOT NULL,
                `cacheName` VARCHAR(191) NOT NULL,
                `funcId` VARCHAR(191) NOT NULL,
            
                INDEX `CacheStorage_funcId_idx`(`funcId`),
                UNIQUE INDEX `CacheStorage_cacheName_funcId_key`(`cacheName`, `funcId`),
                PRIMARY KEY (`id`)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        ",
        )
        .execute(&mysql_pool)
        .await
        .expect("failed to create cache_storage table");

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS `RequestResponseList` (
                `id` VARCHAR(191) NOT NULL,
                `requestUrl` VARCHAR(191) NOT NULL,
                `requestHeaders` BLOB NOT NULL,
                `responseHeaders` BLOB NOT NULL,
                `responseStatus` INTEGER NOT NULL,
                `responseStatusText` TEXT NULL,
                `responseBody` BLOB NULL,
                `cacheId` VARCHAR(191) NOT NULL,
                `lastInsertedAt` DATETIME(3) NOT NULL,
            
                INDEX `RequestResponseList_cacheId_idx`(`cacheId`),
                UNIQUE INDEX `RequestResponseList_cacheId_requestUrl_key`(`cacheId`, `requestUrl`),
                PRIMARY KEY (`id`)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        ",
        )
        .execute(&mysql_pool)
        .await
        .expect("failed to create cache_storage table");

        let redis_url = env::var("REDIS_URL").expect("REDIS_URL must be set");
        let client = redis::Client::open(redis_url).expect("failed to parse redis url");
        let redis_conn = client
            .get_async_connection()
            .await
            .expect("Failed to create Redis connection");

        Self {
            mysql_pool,
            redis_conn: Arc::new(Mutex::new(redis_conn)),
        }
    }
    pub async fn storage_open(&mut self, cache_name: String, func_id: String) -> Result<String> {
        if self
            .storage_has(cache_name.clone(), func_id.clone())
            .await?
        {
            return self.storage_id(cache_name, func_id).await;
        } else {
            let unique_id = cuid2();

            sqlx::query(
                "
        INSERT INTO `CacheStorage` (`id`, `cacheName`, `funcId`)
        VALUES (?, ?, ?);
        ",
            )
            .bind(&unique_id)
            .bind(cache_name)
            .bind(func_id)
            .execute(&self.mysql_pool)
            .await?;

            Ok(unique_id)
        }
    }

    async fn storage_id(&mut self, cache_name: String, func_id: String) -> Result<String> {
        let id = sqlx::query("SELECT * FROM CacheStorage WHERE cacheName = ? AND funcId = ?")
            .bind(cache_name)
            .bind(func_id)
            .map(|row: MySqlRow| {
                let id: String = row.get("id");
                id
            })
            .fetch_one(&self.mysql_pool)
            .await?;
        Ok(id)
    }

    pub async fn storage_has(&self, cache_name: String, func_id: String) -> Result<bool> {
        let cache_exists =
            sqlx::query("SELECT count(id) FROM CacheStorage WHERE cacheName = ? AND funcId = ?")
                .bind(cache_name)
                .bind(func_id)
                .map(|row: MySqlRow| {
                    let count: i64 = row.get("count(id)");
                    count > 0
                })
                .fetch_one(&self.mysql_pool)
                .await
                .unwrap_or(false);
        Ok(cache_exists)
    }

    pub async fn storage_delete(&self, cache_name: String, func_id: String) -> Result<bool> {
        let mut transaction = self
            .mysql_pool
            .begin()
            .await
            .expect("Failed to start database transaction");

        let cache_ids: Vec<String> =
            sqlx::query_scalar("SELECT id FROM CacheStorage WHERE funcId = ? AND cacheName = ?")
                .bind(&func_id)
                .bind(&cache_name)
                .fetch_all(&mut transaction)
                .await
                .expect("Failed to fetch cache ids from CacheStorage");

        let result = sqlx::query("DELETE FROM CacheStorage WHERE funcId = ? AND cacheName = ?")
            .bind(&func_id)
            .bind(&cache_name)
            .execute(&mut transaction)
            .await
            .expect("Failed to execute DELETE statement for CacheStorage");

        let affected_rows = result.rows_affected();
        println!("Deleted {} rows from CacheStorage", affected_rows);

        let params = format!("?{}", ", ?".repeat(cache_ids.len() - 1));
        let query_str = format!(
            "SELECT cacheId, requestUrl FROM RequestResponseList WHERE cacheId IN ({})",
            params
        );

        let mut query = sqlx::query(&query_str);

        for id in &cache_ids {
            query = query.bind(id);
        }

        let redis_ids = query
            .map(|row: MySqlRow| {
                let cache_id: String = row.get("cacheId");
                let request_url: String = row.get("requestUrl");
                format!("{}__{}", cache_id, request_url)
            })
            .fetch_all(&mut transaction)
            .await
            .expect("Failed to fetch rows from RequestResponseList");

        let params = format!("?{}", ", ?".repeat(cache_ids.len() - 1));
        let query_str = format!(
            "DELETE FROM RequestResponseList WHERE cacheId IN ({})",
            params
        );

        let mut query = sqlx::query(&query_str);

        for id in &cache_ids {
            query = query.bind(id);
        }

        let result = query
            .execute(&mut transaction)
            .await
            .expect("Failed to execute DELETE statement for RequestResponseList");

        let affected_rows = result.rows_affected();
        println!("Deleted {} rows from RequestResponseList", affected_rows);
        transaction
            .commit()
            .await
            .expect("Failed to commit database transaction");

        let mut conn = self.redis_conn.lock().await;

        redis::pipe().del(redis_ids).query_async(&mut *conn).await?;

        Ok(true)
    }

    pub async fn put(&self, request_response: CachePutRequest) -> Result<bool> {
        let unique_id = cuid2();

        sqlx::query(
            "INSERT INTO RequestResponseList (id, requestUrl, requestHeaders, responseHeaders, responseBody, responseStatus, responseStatusText, cacheId, lastInsertedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE requestHeaders = VALUES(requestHeaders),
                                     responseHeaders = VALUES(responseHeaders),
                                     responseBody = VALUES(responseBody),
                                     responseStatus = VALUES(responseStatus),
                                     responseStatusText = VALUES(responseStatusText),
                                     lastInsertedAt = VALUES(lastInsertedAt)",
        )
        .bind(&unique_id)
        .bind(&request_response.request_url)
        .bind(&request_response.request_headers)
        .bind(&request_response.response_headers)
        .bind(&request_response.response_body)
        .bind(request_response.response_status as i32)
        .bind(&request_response.response_status_text)
        .bind(&request_response.cache_id)
        .execute(&self.mysql_pool)
        .await?;

        let mut conn = self.redis_conn.lock().await;

        let cache_put_request_json = serde_json::to_string(&request_response)?;

        let expiration = 60 * 30 + rand::thread_rng().gen_range(0..600);

        conn.set_ex(
            format!(
                "{}__{}",
                request_response.cache_id, request_response.request_url
            ),
            cache_put_request_json,
            expiration,
        )
        .await?;
        Ok(true)
    }

    pub async fn get(&self, request: CacheMatchRequest) -> Result<CachePutRequest> {
        let mut conn = self.redis_conn.lock().await;
        let cache_put_request_json: Option<String> = conn
            .get(format!("{}__{}", request.cache_id, request.request_url))
            .await?;

        match cache_put_request_json {
            Some(json) => {
                let cache_put_request: CachePutRequest = serde_json::from_str(&json)?;
                return Ok(cache_put_request);
            }
            None => {
                let mut result = sqlx::query(
                    "SELECT * FROM RequestResponseList WHERE cacheId = ? AND requestUrl = ?",
                )
                .bind(&request.cache_id)
                .bind(&request.request_url)
                .map(|row: MySqlRow| CachePutRequest {
                    cache_id: row.get("cacheId"),
                    request_url: row.get("requestUrl"),
                    request_headers: row.get("requestHeaders"),
                    response_headers: row.get("responseHeaders"),
                    response_body: row.get("responseBody"),
                    response_status: row.get("responseStatus"),
                    response_status_text: row.get("responseStatusText"),
                })
                .fetch_all(&self.mysql_pool)
                .await?;

                if result.len() == 0 {
                    return Err(anyhow!("not match response"));
                }

                let cache_put_request_json = serde_json::to_string(&result[0])?;

                let expiration = 60 * 30 + rand::thread_rng().gen_range(0..600);

                conn.set_ex(
                    format!("{}__{}", request.cache_id, request.request_url),
                    cache_put_request_json,
                    expiration,
                )
                .await?;

                let res = result.remove(0);
                return Ok(res);
            }
        }
    }

    pub async fn del(&self, request: CacheMatchRequest) -> Result<bool> {
        let transaction = self
            .mysql_pool
            .begin()
            .await
            .expect("Failed to start database transaction");

        let _result =
            sqlx::query("DELETE FROM RequestResponseList WHERE cacheId = ? AND requestUrl = ?")
                .bind(&request.cache_id)
                .bind(&request.request_url)
                .execute(&self.mysql_pool)
                .await?;

        transaction
            .commit()
            .await
            .expect("Failed to commit database transaction");
        let mut conn = self.redis_conn.lock().await;

        let redis_key = format!("{}__{}", request.cache_id, request.request_url);

        let cache_put_request_json: Option<String> = conn.get(redis_key.clone()).await?;

        match cache_put_request_json {
            Some(_) => {
                conn.del(redis_key.clone()).await?;
                return Ok(true);
            }
            None => return Ok(true),
        }
    }

    pub async fn res_has(&self, cache_id: String, request_url: String) -> Result<bool> {
        let cache_exists = sqlx::query(
            "SELECT count(id) FROM RequestResponseList WHERE cacheId = ? AND requestUrl = ?",
        )
        .bind(cache_id)
        .bind(request_url)
        .map(|row: MySqlRow| {
            let count: i64 = row.get("count(id)");
            count > 0
        })
        .fetch_one(&self.mysql_pool)
        .await
        .unwrap_or(false);
        Ok(cache_exists)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_backed_cache() {
        env::set_var("DATABASE_URL", "mysql://root:root@localhost:3306/lagon");
        env::set_var("REDIS_URL", "redis://localhost:6379");
        let mut cache = BackedCache::new().await;

        let func_id = "func_id";

        let cache_name = "cache_name";

        let cache_id = cache
            .storage_open(cache_name.into(), func_id.into())
            .await
            .unwrap();

        assert_eq!(
            cache_id,
            cache
                .storage_open(cache_name.into(), func_id.into())
                .await
                .unwrap()
        );

        let put_request = CachePutRequest {
            cache_id: cache_id.clone(),
            request_url: "test_url".to_string(),
            request_headers: "{\"Host\": \"https://lagon.app/\"}".as_bytes().to_vec(),
            response_headers: "{\"Content-Encoding\": \"gzip\"}".as_bytes().to_vec(),
            response_body: "{\"data\": \"https://lagon.app/\"}".as_bytes().to_vec(),
            response_status: 200,
            response_status_text: "Ok".to_string(),
        };

        let put_res = cache.put(put_request).await.unwrap();

        assert_eq!(put_res, true);

        let get_request = CacheMatchRequest {
            cache_id: cache_id.clone(),
            request_url: "test_url".to_string(),
        };

        let get_res = cache.get(get_request).await.unwrap();

        assert_eq!(
            get_res,
            CachePutRequest {
                cache_id: cache_id.clone(),
                request_url: "test_url".to_string(),
                request_headers: "{\"Host\": \"https://lagon.app/\"}".as_bytes().to_vec(),
                response_headers: "{\"Content-Encoding\": \"gzip\"}".as_bytes().to_vec(),
                response_body: "{\"data\": \"https://lagon.app/\"}".as_bytes().to_vec(),
                response_status: 200,
                response_status_text: "Ok".to_string(),
            }
        );

        let put_request = CachePutRequest {
            cache_id: cache_id.clone(),
            request_url: "test_url".to_string(),
            request_headers: "{\"Host\": \"https://lagon.app/\"}".as_bytes().to_vec(),
            response_headers: "{\"Content-Encoding\": \"gzip\"}".as_bytes().to_vec(),
            response_body: "{\"data\": \"https://lagon.app/\"}".as_bytes().to_vec(),
            response_status: 404,
            response_status_text: "Not Found".to_string(),
        };

        let put_res = cache.put(put_request).await.unwrap();

        assert_eq!(put_res, true);

        let get_request = CacheMatchRequest {
            cache_id: cache_id.clone(),
            request_url: "test_url".to_string(),
        };

        let get_res = cache.get(get_request).await.unwrap();

        assert_eq!(
            get_res,
            CachePutRequest {
                cache_id: cache_id.clone(),
                request_url: "test_url".to_string(),
                request_headers: "{\"Host\": \"https://lagon.app/\"}".as_bytes().to_vec(),
                response_headers: "{\"Content-Encoding\": \"gzip\"}".as_bytes().to_vec(),
                response_body: "{\"data\": \"https://lagon.app/\"}".as_bytes().to_vec(),
                response_status: 404,
                response_status_text: "Not Found".to_string(),
            }
        );

        let put_request = CachePutRequest {
            cache_id: cache_id.clone(),
            request_url: "test_url_2".to_string(),
            request_headers: "{\"Host\": \"https://lagon.app/\"}".as_bytes().to_vec(),
            response_headers: "{\"Content-Encoding\": \"gzip\"}".as_bytes().to_vec(),
            response_body: "{\"data\": \"https://lagon.app/\"}".as_bytes().to_vec(),
            response_status: 200,
            response_status_text: "Ok".to_string(),
        };

        let put_res = cache.put(put_request).await.unwrap();

        assert_eq!(put_res, true);

        let res_has_res = cache
            .res_has(cache_id.clone(), "test_url_2".to_string())
            .await
            .unwrap();

        assert_eq!(res_has_res, true);

        let del_request = CacheMatchRequest {
            cache_id: cache_id.clone(),
            request_url: "test_url_2".to_string(),
        };

        let del_res = cache.del(del_request).await.unwrap();

        assert_eq!(del_res, true);

        let res_has_res = cache
            .res_has(cache_id.clone(), "test_url_2".to_string())
            .await
            .unwrap();

        assert_eq!(res_has_res, false);

        let storage_delete_res = cache
            .storage_delete(cache_name.into(), func_id.into())
            .await
            .unwrap();

        assert_eq!(storage_delete_res, true);

        let has_res = cache
            .storage_has(cache_name.into(), func_id.into())
            .await
            .unwrap();

        assert_eq!(has_res, false);
    }
}
