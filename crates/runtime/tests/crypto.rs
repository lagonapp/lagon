use hyper::{header::CONTENT_TYPE, Request, Response};
use lagon_runtime_http::RunResult;
use lagon_runtime_isolate::options::IsolateOptions;
use std::time::Duration;

mod utils;

#[tokio::test]
async fn crypto_random_uuid() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export function handler() {
    const uuid = crypto.randomUUID();
    const secondUuid = crypto.randomUUID();
    return new Response(`${typeof uuid} ${uuid.length} ${uuid === secondUuid}`);
}"
        .into(),
    ));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .body("string 36 false".into())
            .unwrap(),
    )
    .await;
}

#[tokio::test]
async fn crypto_get_random_values() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export function handler() {
    const typedArray = new Uint8Array([0, 8, 2]);
    const result = crypto.getRandomValues(typedArray);
    return new Response(`${result == typedArray} ${typedArray.length} ${result.length} ${typedArray.toString() === '0,8,2'} ${result.toString() === '0,8,2'}`);
}"
        .into(),
    ));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .body("true 3 3 false false".into())
            .unwrap(),
    )
    .await;
}

#[tokio::test]
async fn crypto_get_random_values_update_in_place() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export function handler() {
    const typedArray = new Uint8Array([0, 8, 2]);
    crypto.getRandomValues(typedArray);
    return new Response(`${typedArray.length} ${typedArray.toString() === '0,8,2'}`);
}"
        .into(),
    ));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .body("3 false".into())
            .unwrap(),
    )
    .await;
}

#[tokio::test]
async fn crypto_get_random_values_throw_not_typedarray() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export function handler() {
    const result = crypto.getRandomValues(true);
    return new Response(`${result == typedArray} ${typedArray.length} ${result.length}`);
}"
        .into(),
    ));
    send(Request::default());

    utils::assert_run_result(
        &receiver,
        RunResult::Error(
            "Uncaught TypeError: Parameter 1 is not of type 'TypedArray'\n  at handler (2:27)"
                .to_string(),
        ),
    )
    .await;
}

#[tokio::test]
async fn crypto_key_value() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
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
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .body("object 6".into())
            .unwrap(),
    )
    .await;
}

#[tokio::test]
async fn crypto_unique_key_value() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
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
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .body("false".into())
            .unwrap(),
    )
    .await;
}

#[tokio::test]
async fn crypto_sign() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
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
    }, key, new TextEncoder().encode('Hello'));

    return new Response(`${signed instanceof Uint8Array} ${signed.length}`);
}"
        .into(),
    ));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .body("true 32".into())
            .unwrap(),
    )
    .await;
}

#[tokio::test]
async fn crypto_verify() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
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
    }, key, new TextEncoder().encode('Hello'));

    const verified = await crypto.subtle.verify({
        name: 'HMAC',
    }, key, signed, new TextEncoder().encode('Hello'));

    return new Response(verified);
}"
        .into(),
    ));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .body("true".into())
            .unwrap(),
    )
    .await;
}

#[tokio::test]
async fn crypto_digest_sha1() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export async function handler() {
    const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode('hello, world'));

    return new Response(`${digest.length} ${digest}`);
}"
        .into(),
    ));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .body(
                "20 183,226,62,194,154,242,43,11,78,65,218,49,232,104,213,114,38,18,28,132".into(),
            )
            .unwrap(),
    )
    .await;
}

#[tokio::test]
async fn crypto_digest_string() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export async function handler() {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('hello, world'));

    return new Response(`${digest.length} ${digest}`);
}"
        .into(),
    ));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .body(
                "32 9,202,126,78,170,110,138,233,199,210,97,22,113,41,24,72,131,100,77,7,223,186,124,191,188,76,138,46,8,54,13,91".into(),
            )
            .unwrap(),
    )
    .await;
}

#[tokio::test]
async fn crypto_digest_object() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export async function handler() {
    const digest = await crypto.subtle.digest({ name: 'SHA-256' }, new TextEncoder().encode('hello, world'));

    return new Response(`${digest.length} ${digest}`);
}"
        .into(),
    ));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .body(
                "32 9,202,126,78,170,110,138,233,199,210,97,22,113,41,24,72,131,100,77,7,223,186,124,191,188,76,138,46,8,54,13,91".into(),
            )
            .unwrap(),
    )
    .await;
}

#[tokio::test]
async fn crypto_encrypt_aes_gcm() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export async function handler() {
    const key = await crypto.subtle.generateKey(
        {
            name: 'AES-GCM',
            length: 256,
        },
        true,
        ['encrypt'],
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
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .body("true 28".into())
            .unwrap(),
    )
    .await;
}

#[tokio::test]
async fn crypto_decrypt_aes_gcm() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export async function handler() {
    const key = await crypto.subtle.generateKey(
        {
            name: 'AES-GCM',
            length: 256,
        },
        true,
        ['encrypt'],
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

    return new Response(new TextDecoder().decode(text));
}"
        .into(),
    ));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .body("hello, world".into())
            .unwrap(),
    )
    .await;
}

#[tokio::test]
async fn crypto_encrypt_aes_cbc() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export async function handler() {
    const key = await crypto.subtle.generateKey(
        {
            name: 'AES-CBC',
            length: 256,
        },
        true,
        ['encrypt'],
    );

    const iv = crypto.getRandomValues(new Uint8Array(16));
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-CBC', iv },
        key,
        new TextEncoder().encode('hello, world'),
    );

    return new Response(`${ciphertext instanceof Uint8Array} ${ciphertext.length}`);
}"
        .into(),
    ));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .body("true 16".into())
            .unwrap(),
    )
    .await;
}

#[tokio::test]
async fn crypto_decrypt_aes_cbc() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export async function handler() {
    const key = await crypto.subtle.generateKey(
        {
            name: 'AES-CBC',
            length: 256,
        },
        true,
        ['encrypt'],
    );

    const iv = crypto.getRandomValues(new Uint8Array(16));
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-CBC', iv },
        key,
        new TextEncoder().encode('hello, world'),
    );

    const text = await crypto.subtle.decrypt(
        { name: 'AES-CBC', iv },
        key,
        ciphertext,
    );

    return new Response(new TextDecoder().decode(text));
}"
        .into(),
    ));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .body("hello, world".into())
            .unwrap(),
    )
    .await;
}

#[tokio::test]
async fn crypto_encrypt_aes_ctr() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export async function handler() {
    const key = await crypto.subtle.generateKey(
        {
            name: 'AES-CTR',
            length: 256,
        },
        true,
        ['encrypt'],
    );

    const counter = crypto.getRandomValues(new Uint8Array(16));
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-CTR', counter, length: 32 },
        key,
        new TextEncoder().encode('hello, world'),
    );

    return new Response(`${ciphertext instanceof Uint8Array} ${ciphertext.length}`);
}"
        .into(),
    ));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .body("true 12".into())
            .unwrap(),
    )
    .await;
}

#[tokio::test]
async fn crypto_decrypt_aes_ctr() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export async function handler() {
    const key = await crypto.subtle.generateKey(
        {
            name: 'AES-CTR',
            length: 256,
        },
        true,
        ['encrypt'],
    );
    const counter = crypto.getRandomValues(new Uint8Array(16));

    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-CTR', counter, length: 32 },
        key,
        new TextEncoder().encode('hello, world'),
    );

    const text = await crypto.subtle.decrypt(
        { name: 'AES-CTR', counter, length: 32 },
        key,
        ciphertext,
    );

    return new Response(new TextDecoder().decode(text));
}"
        .into(),
    ));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .body("hello, world".into())
            .unwrap(),
    )
    .await;
}

#[tokio::test]
async fn crypto_hkdf_derive_bits() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export async function handler() {
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode('secret'),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['deriveBits'],
    );
    const salt = await crypto.getRandomValues(new Uint8Array(16));
    const info = await crypto.getRandomValues(new Uint8Array(16));
    const result = await crypto.subtle.deriveBits(
        {
            name: 'HKDF',
            hash: 'SHA-256',
            salt,
            info: info,
        },
        key,
        128,
    );
    return new Response(`${result.byteLength}`);
}"
        .into(),
    ));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .body("16".into())
            .unwrap(),
    )
    .await;
}

#[tokio::test]
async fn crypto_pbkdf2_derive_bits() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export async function handler() {
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode('secret'),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['deriveBits'],
    );
    const salt = await crypto.getRandomValues(new Uint8Array(16));
    const info = await crypto.getRandomValues(new Uint8Array(16));
    const result = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            hash: 'SHA-256',
            salt,
            iterations: 10000,
        },
        key,
        128,
    );
    return new Response(`${result.byteLength}`);
}"
        .into(),
    ));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .body("16".into())
            .unwrap(),
    )
    .await;
}

#[tokio::test]
async fn crypto_ecdh_derive_bits() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(
        IsolateOptions::new(
            "export async function handler() {
    const keypair_1 = await crypto.subtle.generateKey(
        {
            name: 'ECDH',
            namedCurve: 'P-256',
        },
        true,
        ['deriveBits', 'deriveKey'],
    );
    const result_1 = await crypto.subtle.deriveBits(
        {
            name: 'ECDH',
            namedCurve: 'P-256',
            public: keypair_1.publicKey,
        },
        keypair_1.privateKey,
        256,
    );

    const keypair_2 = await crypto.subtle.generateKey(
        {
            name: 'ECDH',
            namedCurve: 'P-384',
        },
        true,
        ['deriveBits', 'deriveKey'],
    );
    const result_2 = await crypto.subtle.deriveBits(
        {
            name: 'ECDH',
            namedCurve: 'P-384',
            public: keypair_2.publicKey,
        },
        keypair_2.privateKey,
        384,
    );
    return new Response(`${result_1.byteLength * 8} ${result_2.byteLength * 8}`);
}"
            .into(),
        )
        .tick_timeout(Duration::from_secs(5))
        .total_timeout(Duration::from_secs(10)),
    );
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .body("256 384".into())
            .unwrap(),
    )
    .await;
}

#[tokio::test]
async fn crypto_derive_key() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export async function handler() {
    const rawKey = await crypto.getRandomValues(new Uint8Array(16));
    const key = await crypto.subtle.importKey(
        'raw',
        rawKey,
        'PBKDF2',
        false,
        ['deriveKey', 'deriveBits'],
    );

    const salt = await crypto.getRandomValues(new Uint8Array(16));
    const derivedKey = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt,
            iterations: 1000,
            hash: 'SHA-256',
        },
        key,
        { name: 'HMAC', hash: 'SHA-256' },
        true,
        ['sign'],
    );

    const algorithm = derivedKey.algorithm

    return new Response(`${derivedKey instanceof CryptoKey} ${derivedKey.type === 'secret'} ${derivedKey.extractable} ${derivedKey.usages?.length === 1} ${algorithm.name === 'HMAC'}`);
}"
        .into(),
    ));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .body("true true true true true".into())
            .unwrap(),
    )
    .await;
}

#[tokio::test]
async fn crypto_ecdsa_sign_verify() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export async function handler() {
    const keypair_1 = await crypto.subtle.generateKey(
        {
            name: 'ECDSA',
            namedCurve: 'P-384',
        },
        true,
        ['sign', 'verified'],
    );

    const data = new Uint8Array([1, 2, 3]);
    const signAlgorithm = { name: 'ECDSA', hash: 'SHA-384' };
    const signature = await crypto.subtle.sign(
        signAlgorithm,
        keypair_1.privateKey,
        data,
    );

    const verified = await crypto.subtle.verify(
        signAlgorithm,
        keypair_1.publicKey,
        signature,
        data,
    );
    return new Response(`${verified}`);
}"
        .into(),
    ));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .body("true".into())
            .unwrap(),
    )
    .await;
}

#[tokio::test]
async fn crypto_rsa_pss_sign_verify() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(
        IsolateOptions::new(
            "export async function handler() {
    const keypair = await crypto.subtle.generateKey(
        {
            name: 'RSA-PSS',
            modulusLength: 1024,
            publicExponent: new Uint8Array([1, 0, 1]),
        },
        true,
        ['sign', 'verify'],
    );

    const data = new Uint8Array([1, 2, 3]);
    const signAlgorithm = { name: 'RSA-PSS', saltLength: 32 };
    const signature = await crypto.subtle.sign(
        signAlgorithm,
        keypair.privateKey,
        data,
    );

    const verified = await crypto.subtle.verify(
        signAlgorithm,
        keypair.publicKey,
        signature,
        data,
    );
    return new Response(`${verified}`);
}"
            .into(),
        )
        .tick_timeout(Duration::from_secs(5))
        .total_timeout(Duration::from_secs(10)),
    );
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .body("true".into())
            .unwrap(),
    )
    .await;
}

#[tokio::test]
async fn crypto_rsa_ssa_sign_verify() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(
        IsolateOptions::new(
            "export async function handler() {
    const keypair = await crypto.subtle.generateKey(
        {
            name: 'RSASSA-PKCS1-v1_5',
            modulusLength: 1024,
            publicExponent: new Uint8Array([1, 0, 1]),
        },
        true,
        ['sign', 'verify'],
    );

    const data = new Uint8Array([1, 2, 3]);
    const signAlgorithm = { name: 'RSASSA-PKCS1-v1_5', saltLength: 32 };
    const signature = await crypto.subtle.sign(
        signAlgorithm,
        keypair.privateKey,
        data,
    );

    const verified = await crypto.subtle.verify(
        signAlgorithm,
        keypair.publicKey,
        signature,
        data,
    );
    return new Response(`${verified}`);
}"
            .into(),
        )
        .tick_timeout(Duration::from_secs(5))
        .total_timeout(Duration::from_secs(10)),
    );
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .body("true".into())
            .unwrap(),
    )
    .await;
}
