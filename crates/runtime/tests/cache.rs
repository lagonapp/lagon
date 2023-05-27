use std::env;

use hyper::{header::CONTENT_TYPE, Request, Response};
use lagon_runtime_isolate::options::IsolateOptions;

mod utils;

#[tokio::test]
async fn cache_test() {
    utils::setup();
    env::set_var("DATABASE_URL", "mysql://root:root@localhost:3306/lagon");
    env::set_var("REDIS_URL", "redis://localhost:6379");

    let (send, receiver) = utils::create_isolate(
        IsolateOptions::new(
            "export async function handler() {
        const res = new Response('{\"data\": \"test\"}', {
            status: 200,
            statusText: 'Ok',
        })
        await cache.put('/test', res);

        const result = await cache.match('/test');

        const b = await result.text();
      
        return new Response(`${result.status} ${result.statusText} ${`{\"data\": \"test\"}`}`);
      }"
            .into(),
        )
        .metadata(Some(("cache_test".into(), "cache_test".into()))),
    );
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .body("200 OK {\"data\": \"test\"}".into())
            .unwrap(),
    )
    .await;
}
