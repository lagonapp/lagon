use criterion::{criterion_group, criterion_main, BenchmarkId, Criterion};
use hyper::Uri;

fn uri_tostring(uri: &Uri) -> String {
    let mut url = uri.to_string();
    url.remove(0);
    url
}

fn uri_path_tostring(uri: &Uri) -> String {
    let mut url = uri.path().to_string();
    url.remove(0);
    url
}

fn uri_path_tostring2(uri: &Uri) -> String {
    let url = uri.path();
    let url = &url[1..];
    url.to_string()
}

fn uri_path_tostring3(uri: &Uri) -> &str {
    let url = uri.path();
    &url[1..]
}

fn bench_uri(c: &mut Criterion) {
    let mut group = c.benchmark_group("Fibonacci");

    let uri = Uri::builder().path_and_query("/foo/bar").build().unwrap();

    group.bench_with_input(BenchmarkId::new("to_string", 0), &uri, |b, uri| {
        b.iter(|| uri_tostring(uri))
    });
    group.bench_with_input(BenchmarkId::new("path::to_string", 0), &uri, |b, uri| {
        b.iter(|| uri_path_tostring(uri))
    });
    group.bench_with_input(BenchmarkId::new("path::to_string2", 0), &uri, |b, uri| {
        b.iter(|| uri_path_tostring2(uri))
    });
    group.bench_with_input(BenchmarkId::new("path::to_string3", 0), &uri, |b, uri| {
        b.iter(|| uri_path_tostring3(uri))
    });

    group.finish();
}

criterion_group!(benches, bench_uri);
criterion_main!(benches);
