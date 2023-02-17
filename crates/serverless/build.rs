use lagon_runtime::{options::RuntimeOptions, Runtime};
use lagon_runtime_isolate::{options::IsolateOptions, Isolate};

fn main() {
    let runtime = Runtime::new(RuntimeOptions::default());
    let mut isolate = Isolate::new(IsolateOptions::new("".into()).snapshot(true));

    let snapshot = isolate.snapshot();
    let snapshot_slice: &[u8] = &snapshot;

    std::fs::write("snapshot.bin", snapshot_slice).unwrap();

    runtime.dispose();
}
