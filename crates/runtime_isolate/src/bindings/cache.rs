use std::{rc::Rc, sync::Arc};

use anyhow::{anyhow, Result};
use lagon_runtime_cache::{BackedCache, CacheMatchRequest, CachePutRequest};
use lagon_runtime_v8_utils::{cache_request_from_v8, cache_response_from_v8, v8_string};
use tokio::sync::Mutex;
use v8::{Local, ObjectTemplate};

use crate::Isolate;

use super::{BindingResult, PromiseResult};

type MatchArg = String;
type DelArg = String;
type PutArg = ((String, Vec<u8>), (Vec<u8>, Vec<u8>, u16, String));

const CACHE_NAME: &str = "__LAGON_CACHE_NAME__";

macro_rules! async_cache_binding {
    ($scope: ident, $lagon_object: ident, $name: literal, $init: expr, $binding: expr) => {
        let binding = |scope: &mut v8::HandleScope,
                       args: v8::FunctionCallbackArguments,
                       mut retval: v8::ReturnValue| {
            let promise = v8::PromiseResolver::new(scope).unwrap();
            retval.set(promise.into());

            let isolate_state = Isolate::state(scope);
            let mut state = isolate_state.borrow_mut();
            let id = state.js_promises.len() + 1;

            let global_promise = v8::Global::new(scope, promise);
            state.js_promises.insert(id, global_promise);

            drop(state);

            match $init(scope, args) {
                Ok(args) => {
                    let state = isolate_state.borrow();
                    let metadata = Rc::clone(&state.metadata);
                    let cache = Arc::clone(&state.cache);
                    match &*metadata {
                        Some((_, func_id)) => {
                            let future = $binding(cache, func_id.clone(), id, args);

                            state.promises.push(Box::pin(future));
                        }
                        _ => {
                            let error = v8_string(scope, "Not Found function id.");
                            promise.reject(scope, error.into());
                        }
                    }
                }
                Err(error) => {
                    let error = v8_string(scope, &error.to_string());
                    promise.reject(scope, error.into());
                }
            }
        };

        $lagon_object.set(
            v8_string($scope, $name).into(),
            v8::FunctionTemplate::new($scope, binding).into(),
        );
    };
}

pub fn cache_match_init(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
) -> Result<MatchArg> {
    let url = args.get(0).to_rust_string_lossy(scope);

    Ok(url)
}

pub async fn cache_match_binding(
    cache: Arc<Mutex<Option<BackedCache>>>,
    func_id: String,
    id: usize,
    url: MatchArg,
) -> BindingResult {
    let mut cache_lock = cache.lock().await;

    let cache = match cache_lock.as_mut() {
        Some(c) => c,
        None => {
            let bc = BackedCache::new().await;
            *cache_lock = Some(bc);
            cache_lock.as_mut().unwrap()
        }
    };

    match cache.storage_open(CACHE_NAME.into(), func_id).await {
        Ok(cache_id) => {
            let get_request = CacheMatchRequest {
                cache_id: cache_id,
                request_url: url,
            };
            match cache.get(get_request).await {
                Ok(res) => {
                    return BindingResult {
                        id,
                        result: PromiseResult::CacheResponse((
                            res.response_headers,
                            res.response_body,
                            res.response_status,
                            res.response_status_text,
                        )),
                    }
                }
                Err(error) => BindingResult {
                    id,
                    result: PromiseResult::Error(error.to_string()),
                },
            }
        }
        Err(error) => BindingResult {
            id,
            result: PromiseResult::Error(error.to_string()),
        },
    }
}

pub fn cache_del_init(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
) -> Result<DelArg> {
    let url = args.get(0).to_rust_string_lossy(scope);

    Ok(url)
}

pub async fn cache_del_binding(
    cache: Arc<Mutex<Option<BackedCache>>>,
    func_id: String,
    id: usize,
    url: DelArg,
) -> BindingResult {
    let mut cache_lock = cache.lock().await;

    let cache = match cache_lock.as_mut() {
        Some(c) => c,
        None => {
            let bc = BackedCache::new().await;
            *cache_lock = Some(bc);
            cache_lock.as_mut().unwrap()
        }
    };

    match cache.storage_open(CACHE_NAME.into(), func_id).await {
        Ok(cache_id) => {
            let get_request = CacheMatchRequest {
                cache_id: cache_id,
                request_url: url,
            };
            match cache.del(get_request).await {
                Ok(res) => {
                    return BindingResult {
                        id,
                        result: PromiseResult::Boolean(res),
                    }
                }
                Err(error) => BindingResult {
                    id,
                    result: PromiseResult::Error(error.to_string()),
                },
            }
        }
        Err(error) => BindingResult {
            id,
            result: PromiseResult::Error(error.to_string()),
        },
    }
}

pub fn cache_put_init(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
) -> Result<PutArg> {
    let req_meta_data = args.get(0);
    let res_meta_data = args.get(1);
    let req = cache_request_from_v8(scope, req_meta_data)?;
    let res = cache_response_from_v8(scope, res_meta_data)?;

    Ok((req, res))
}

pub async fn cache_put_binding(
    cache: Arc<Mutex<Option<BackedCache>>>,
    func_id: String,
    id: usize,
    arg: PutArg,
) -> BindingResult {
    let mut cache_lock = cache.lock().await;

    let cache = match cache_lock.as_mut() {
        Some(c) => c,
        None => {
            let bc = BackedCache::new().await;
            *cache_lock = Some(bc);
            cache_lock.as_mut().unwrap()
        }
    };

    match cache.storage_open(CACHE_NAME.into(), func_id).await {
        Ok(cache_id) => {
            let put_request = CachePutRequest {
                cache_id: cache_id,
                request_url: arg.0 .0,
                request_headers: arg.0 .1,
                response_headers: arg.1 .0,
                response_body: arg.1 .1,
                response_status: arg.1 .2,
                response_status_text: arg.1 .3,
            };
            match cache.put(put_request).await {
                Ok(_) => {
                    return BindingResult {
                        id,
                        result: PromiseResult::Undefined,
                    }
                }
                Err(error) => BindingResult {
                    id,
                    result: PromiseResult::Error(error.to_string()),
                },
            }
        }
        Err(error) => BindingResult {
            id,
            result: PromiseResult::Error(error.to_string()),
        },
    }
}

pub fn cache_init<'a>(scope: &mut v8::HandleScope<'a, ()>, lagon_object: &Local<ObjectTemplate>) {
    async_cache_binding!(
        scope,
        lagon_object,
        "cacheMatch",
        cache_match_init,
        cache_match_binding
    );

    async_cache_binding!(
        scope,
        lagon_object,
        "cacheDel",
        cache_del_init,
        cache_del_binding
    );

    async_cache_binding!(
        scope,
        lagon_object,
        "cachePut",
        cache_put_init,
        cache_put_binding
    );
}
