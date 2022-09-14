use std::{
    ffi::c_void,
    mem::MaybeUninit,
    sync::{
        atomic::{AtomicUsize, Ordering},
        Arc,
    },
};

pub fn create_allocator(count: Arc<AtomicUsize>) -> v8::UniqueRef<v8::Allocator> {
    unsafe extern "C" fn allocate(count: &AtomicUsize, n: usize) -> *mut c_void {
        count.fetch_add(n, Ordering::SeqCst);
        Box::into_raw(vec![0u8; n].into_boxed_slice()) as *mut [u8] as *mut c_void
    }
    unsafe extern "C" fn allocate_uninitialized(count: &AtomicUsize, n: usize) -> *mut c_void {
        count.fetch_add(n, Ordering::SeqCst);
        let mut store: Vec<MaybeUninit<u8>> = Vec::with_capacity(n);
        store.set_len(n);
        Box::into_raw(store.into_boxed_slice()) as *mut [u8] as *mut c_void
    }
    unsafe extern "C" fn free(count: &AtomicUsize, data: *mut c_void, n: usize) {
        count.fetch_sub(n, Ordering::SeqCst);
        Box::from_raw(std::slice::from_raw_parts_mut(data as *mut u8, n));
    }
    unsafe extern "C" fn reallocate(
        count: &AtomicUsize,
        prev: *mut c_void,
        oldlen: usize,
        newlen: usize,
    ) -> *mut c_void {
        count.fetch_add(newlen.wrapping_sub(oldlen), Ordering::SeqCst);
        let old_store = Box::from_raw(std::slice::from_raw_parts_mut(prev as *mut u8, oldlen));
        let mut new_store = Vec::with_capacity(newlen);
        let copy_len = oldlen.min(newlen);
        new_store.extend_from_slice(&old_store[..copy_len]);
        new_store.resize(newlen, 0u8);
        Box::into_raw(new_store.into_boxed_slice()) as *mut [u8] as *mut c_void
    }
    unsafe extern "C" fn drop(count: *const AtomicUsize) {
        Arc::from_raw(count);
    }
    let vtable: &'static v8::RustAllocatorVtable<AtomicUsize> = &v8::RustAllocatorVtable {
        allocate,
        allocate_uninitialized,
        free,
        reallocate,
        drop,
    };

    unsafe { v8::new_rust_allocator(Arc::into_raw(count.clone()), vtable) }
}
