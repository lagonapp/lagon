use hyper::Method as HyperMethod;

#[derive(Debug, Copy, Clone)]
pub enum Method {
    GET,
    POST,
    PUT,
    PATCH,
    DELETE,
    HEAD,
    OPTIONS,
}

impl From<Method> for &str {
    fn from(method: Method) -> Self {
        match method {
            Method::GET => "GET",
            Method::POST => "POST",
            Method::PUT => "PUT",
            Method::PATCH => "PATCH",
            Method::DELETE => "DELETE",
            Method::HEAD => "HEAD",
            Method::OPTIONS => "OPTIONS",
        }
    }
}

impl From<&str> for Method {
    fn from(method: &str) -> Self {
        match method {
            "POST" => Method::POST,
            "PUT" => Method::PUT,
            "PATCH" => Method::PATCH,
            "DELETE" => Method::DELETE,
            "HEAD" => Method::HEAD,
            "OPTIONS" => Method::OPTIONS,
            _ => Method::GET,
        }
    }
}

impl From<&HyperMethod> for Method {
    fn from(method: &HyperMethod) -> Self {
        match *method {
            HyperMethod::POST => Method::POST,
            HyperMethod::PUT => Method::PUT,
            HyperMethod::PATCH => Method::PATCH,
            HyperMethod::DELETE => Method::DELETE,
            HyperMethod::HEAD => Method::HEAD,
            HyperMethod::OPTIONS => Method::OPTIONS,
            _ => Method::GET,
        }
    }
}
