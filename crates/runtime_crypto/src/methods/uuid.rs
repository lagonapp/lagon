use uuid::Uuid;

pub fn uuid() -> String {
    Uuid::new_v4().to_string()
}
