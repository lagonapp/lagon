use lagon_runtime::{options::RuntimeOptions, Runtime};
use lagon_runtime_http::{Request, Response, RunResult};
use lagon_runtime_isolate::{options::IsolateOptions, Isolate};
use std::sync::Once;

fn setup() {
    static START: Once = Once::new();

    START.call_once(|| {
        Runtime::new(RuntimeOptions::default());
    });
}

#[tokio::test(flavor = "multi_thread")]
async fn crypto_random_uuid() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export function handler() {
    const uuid = crypto.randomUUID();
    const secondUuid = crypto.randomUUID();
    return new Response(`${typeof uuid} ${uuid.length} ${uuid === secondUuid}`);
}"
        .into(),
    ));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response::from("string 36 false"))
    );
}

#[tokio::test(flavor = "multi_thread")]
async fn crypto_get_random_values() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export function handler() {
    const typedArray = new Uint8Array([0, 8, 2]);
    const result = crypto.getRandomValues(typedArray);
    return new Response(`${result == typedArray} ${typedArray.length} ${result.length}`);
}"
        .into(),
    ));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response::from("false 3 3"))
    );
}

#[tokio::test(flavor = "multi_thread")]
async fn crypto_key_value() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export async function handler() {
    const { keyValue } = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode('secret'),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
    );

    return new Response(`${typeof keyValue} ${keyValue.length}`);
}"
        .into(),
    ));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response::from("object 32"))
    );
}

#[tokio::test(flavor = "multi_thread")]
async fn crypto_unique_key_value() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export async function handler() {
    const { keyValue: first } = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode('secret'),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
    );
    const { keyValue: second } = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode('secret'),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
    );

    return new Response(first == second);
}"
        .into(),
    ));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response::from("false"))
    );
}

#[tokio::test(flavor = "multi_thread")]
async fn crypto_sign() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export async function handler() {
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode('secret'),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
    );

    const signed = await crypto.subtle.sign({
        name: 'HMAC',
        hash: 'SHA-256',
    }, key, new TextEncoder().encode('Hello'));

    return new Response(`${signed instanceof Uint8Array} ${signed.length}`);
}"
        .into(),
    ));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response::from("true 32"))
    );
}

#[tokio::test(flavor = "multi_thread")]
async fn crypto_verify() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export async function handler() {
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode('secret'),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
    );

    const signed = await crypto.subtle.sign({
        name: 'HMAC',
        hash: 'SHA-256',
    }, key, new TextEncoder().encode('Hello'));

    const verified = await crypto.subtle.verify({
        name: 'HMAC',
        hash: 'SHA-256',
    }, key, signed, new TextEncoder().encode('Hello'));

    return new Response(verified);
}"
        .into(),
    ));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response::from("true"))
    );
}

#[tokio::test(flavor = "multi_thread")]
async fn crypto_digest_sha1() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export async function handler() {
    const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode('hello, world'));

    return new Response(`${digest.length} ${digest}`);
}"
        .into(),
    ));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response::from(
            "20 183,226,62,194,154,242,43,11,78,65,218,49,232,104,213,114,38,18,28,132"
        ))
    );
}

#[tokio::test(flavor = "multi_thread")]
async fn crypto_digest_string() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export async function handler() {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('hello, world'));

    return new Response(`${digest.length} ${digest}`);
}"
        .into(),
    ));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response::from("32 9,202,126,78,170,110,138,233,199,210,97,22,113,41,24,72,131,100,77,7,223,186,124,191,188,76,138,46,8,54,13,91"))
    );
}

#[tokio::test(flavor = "multi_thread")]
async fn crypto_digest_object() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export async function handler() {
    const digest = await crypto.subtle.digest({ name: 'SHA-256' }, new TextEncoder().encode('hello, world'));

    return new Response(`${digest.length} ${digest}`);
}"
        .into(),
    ));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response::from("32 9,202,126,78,170,110,138,233,199,210,97,22,113,41,24,72,131,100,77,7,223,186,124,191,188,76,138,46,8,54,13,91"))
    );
}

#[tokio::test(flavor = "multi_thread")]
async fn crypto_encrypt() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export async function handler() {
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode('secret'),
        { name: 'AES-GCM' },
        false,
        ['sign'],
    );

    const iv = crypto.getRandomValues(new Uint8Array(16));
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        new TextEncoder().encode('hello, world'),
    );

    return new Response(`${ciphertext instanceof Uint8Array} ${ciphertext.length}`);
}"
        .into(),
    ));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response::from("true 28"))
    );
}

#[tokio::test(flavor = "multi_thread")]
async fn crypto_decrypt() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export async function handler() {
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode('secret'),
        { name: 'AES-GCM' },
        false,
        ['sign'],
    );

    const iv = crypto.getRandomValues(new Uint8Array(16));
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        new TextEncoder().encode('hello, world'),
    );

    const text = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext,
    );

    return new Response(text);
}"
        .into(),
    ));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response::from("hello, world"))
    );
}
