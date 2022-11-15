use lagon_runtime::{
    isolate::{Isolate, IsolateOptions},
    runtime::{Runtime, RuntimeOptions},
};

fn main() {
    let runtime = Runtime::new(RuntimeOptions::default());
    let mut isolate = Isolate::<()>::new(IsolateOptions::new("".into()).with_dry_run(true));

    let snapshot = isolate.snapshot();
    let snapshot_slice: &[u8] = &snapshot;

    println!("Snapshot: {:?}", snapshot_slice);

    std::fs::write("snapshot.bin", snapshot_slice).unwrap();

    runtime.dispose();
}
