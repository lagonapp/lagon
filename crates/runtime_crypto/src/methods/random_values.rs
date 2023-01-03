use rand::random;

pub fn random_values(mut buf: Vec<u8>) -> Vec<u8> {
    #[allow(clippy::needless_range_loop)]
    for i in 0..buf.len() {
        buf[i] = random();
    }

    buf
}
