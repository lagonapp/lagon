use std::collections::HashMap;

#[derive(Debug)]
pub enum Method {
  GET,
  POST,
  PUT,
  PATCH,
  DELETE,
  HEAD,
  OPTIONS,
}

#[derive(Debug)]
pub struct Request {
  pub headers: HashMap<String, String>,
  pub method: Method,
  pub body: String,
}

#[derive(Debug)]
pub struct Response {
  pub headers: Option<HashMap<String, String>>,
  pub body: String,
  pub status: u16,
}
