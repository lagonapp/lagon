use std::{
    cell::RefCell,
    rc::Rc,
    sync::{atomic::AtomicUsize, Arc},
    time::Instant,
};

use crate::{
    extract::extract_v8_string,
    http::{Request, Response},
    result::RunResult,
};

use super::allocator::create_allocator;

#[derive(Clone)]
pub(crate) struct IsolateState {
    global_context: v8::Global<v8::Context>,
}

pub struct IsolateOptions {
    pub code: String,
    pub timeout: u64,
    pub memory_limit: usize,
    // pub snapshot_blob: Option<Box<dyn Allocated<[u8]>>>,
}

impl IsolateOptions {
    pub fn default(code: String) -> Self {
        Self {
            code,
            timeout: 50, // 50ms
            memory_limit: 128, // 128MB
                         // snapshot_blob: None,
        }
    }
}

pub struct Isolate {
    options: IsolateOptions,
    isolate: v8::OwnedIsolate,
    handler: Option<v8::Global<v8::Function>>,
}

unsafe impl Send for Isolate {}

impl Isolate {
    pub fn new(options: IsolateOptions) -> Self {
        let memory_mb = options.memory_limit * 1024 * 1024;
        let count = Arc::new(AtomicUsize::new(options.memory_limit));
        let array_buffer_allocator = create_allocator(count.clone());

        let params = v8::CreateParams::default()
            .heap_limits(0, memory_mb)
            .array_buffer_allocator(array_buffer_allocator);

        // TODO
        // if let Some(snapshot_blob) = self.options.snapshot_blob {
        //     params = params.snapshot_blob(snapshot_blob.as_mut());
        // }

        let mut isolate = v8::Isolate::new(params);

        let state = {
            let scope = &mut v8::HandleScope::new(&mut isolate);
            let context = v8::Context::new(scope);

            let global = v8::Global::new(scope, context);

            IsolateState {
                global_context: global,
            }
        };

        isolate.set_slot(Rc::new(RefCell::new(state)));

        Self {
            options,
            isolate,
            handler: None,
        }
    }

    pub(crate) fn global_realm(&self) -> IsolateState {
        let state = self
            .isolate
            .get_slot::<Rc<RefCell<IsolateState>>>()
            .unwrap();
        let state = state.borrow();
        state.clone()
    }

    pub fn run(&mut self, request: Request) -> RunResult {
        let state = self.global_realm();
        let scope =
            &mut v8::HandleScope::with_context(&mut self.isolate, state.global_context.clone());

        if self.handler.is_none() {
            let code = &self.options.code;
            let code = v8::String::new(scope, &format!(r#"
// src/runtime/parseMultipart.ts
var parseMultipart = (headers, body) => {{
    if (!body) {{
    return {{}};
    }}
    const contentTypeHeader = headers.get("content-type");
    let boundary;
    const getBoundary = (header) => header?.split(";")?.[1]?.split("=")?.[1];
    if (Array.isArray(contentTypeHeader)) {{
    contentTypeHeader.forEach((header) => {{
        if (!boundary) {{
        boundary = getBoundary(header);
        }}
    }});
    }} else {{
    boundary = getBoundary(contentTypeHeader);
    }}
    if (!boundary) {{
    return {{}};
    }}
    const result = {{}};
    for (const part of body.split(boundary)) {{
    if (part?.includes("Content-Disposition")) {{
        const content = part.split('name="')?.[1].split('"\\r\\n\\r\\n');
        if (content) {{
        const [name, value] = content;
        result[name] = value.replace("\\r\\n\\r\\n--", "");
        }}
    }}
    }}
    return result;
}};

// src/runtime/Response.ts
var Response = class {{
    constructor(body, options) {{
    this.body = body;
    if (options?.headers) {{
        if (options.headers instanceof Headers) {{
        this.headers = options.headers;
        }} else {{
        this.headers = new Headers(options.headers);
        }}
    }} else {{
        this.headers = new Headers();
    }}
    if (options?.status) {{
        this.ok = options.status >= 200 && options.status < 300;
    }} else {{
        this.ok = true;
    }}
    this.status = options?.status || 200;
    this.statusText = options?.statusText || "OK";
    this.url = options?.url || "";
    }}
    async text() {{
    if (this.body instanceof Uint8Array) {{
        throw new Error("Cannot read text from Uint8Array");
    }}
    return this.body;
    }}
    async json() {{
    if (this.body instanceof Uint8Array) {{
        throw new Error("Cannot read text from Uint8Array");
    }}
    return JSON.parse(this.body);
    }}
    async formData() {{
    if (this.body instanceof Uint8Array) {{
        throw new Error("Cannot read text from Uint8Array");
    }}
    return parseMultipart(this.headers, this.body);
    }}
}};

// src/runtime/fetch.ts
var Headers = class {{
    constructor(init) {{
    this.headers = /* @__PURE__ */ new Map();
    if (init) {{
        if (Array.isArray(init)) {{
        init.forEach(([key, value]) => {{
            this.addValue(key, value);
        }});
        }} else {{
        Object.entries(init).forEach(([key, value]) => {{
            this.addValue(key, value);
        }});
        }}
    }}
    }}
    addValue(name, value) {{
    const values = this.headers.get(name);
    if (values) {{
        values.push(value);
    }} else {{
        this.headers.set(name, [value]);
    }}
    }}
    append(name, value) {{
    this.addValue(name, value);
    }}
    delete(name) {{
    this.headers.delete(name);
    }}
    *entries() {{
    for (const [key, values] of this.headers) {{
        for (const value of values) {{
        yield [key, value];
        }}
    }}
    }}
    get(name) {{
    return this.headers.get(name)?.[0];
    }}
    has(name) {{
    return this.headers.has(name);
    }}
    keys() {{
    return this.headers.keys();
    }}
    set(name, value) {{
    this.headers.set(name, [value]);
    }}
    *values() {{
    for (const [, values] of this.headers) {{
        for (const value of values) {{
        yield value;
        }}
    }}
    }}
}};

// src/runtime/Request.ts
var Request = class {{
    constructor(input, options) {{
    this.method = options?.method || "GET";
    if (options?.headers) {{
        if (options.headers instanceof Headers) {{
        this.headers = options.headers;
        }} else {{
        this.headers = new Headers(options.headers);
        }}
    }} else {{
        this.headers = new Headers();
    }}
    this.body = options?.body;
    this.url = input;
    }}
    async text() {{
    return this.body || "";
    }}
    async json() {{
    return JSON.parse(this.body || "{{}}");
    }}
    async formData() {{
    return parseMultipart(this.headers, this.body);
    }}
}};


{code}

export function masterHandler(request) {{
    const handlerRequest = new Request(request.input, {{
        method: request.method,
        headers: request.headers,
        body: request.body,
    }});

    return handler(handlerRequest)
}}"#)).unwrap();
            let resource_name = v8::String::new(scope, "isolate.js").unwrap();
            let source_map_url = v8::String::new(scope, "").unwrap();

            let source = v8::script_compiler::Source::new(
                code,
                Some(&v8::ScriptOrigin::new(
                    scope,
                    resource_name.into(),
                    0,
                    0,
                    false,
                    0,
                    source_map_url.into(),
                    false,
                    false,
                    true,
                )),
            );

            let module = v8::script_compiler::compile_module(scope, source).unwrap();
            // TODO: disable imports
            module.instantiate_module(scope, |a, b, c, d| None).unwrap();
            module.evaluate(scope).unwrap();

            let namespace = module.get_module_namespace();
            let namespace = v8::Local::<v8::Object>::try_from(namespace).unwrap();

            let handler = v8::String::new(scope, "masterHandler").unwrap();
            let handler = namespace.get(scope, handler.into()).unwrap();
            let handler = v8::Local::<v8::Function>::try_from(handler).unwrap();
            let handler = v8::Global::new(scope, handler);

            self.handler = Some(handler);
        }

        let request_param = v8::Object::new(scope);

        let input_key = v8::String::new(scope, "input").unwrap();
        let input_key = v8::Local::new(scope, input_key);
        let input_value = v8::String::new(scope, "TODO").unwrap();
        let input_value = v8::Local::new(scope, input_value);
        request_param.set(scope, input_key.into(), input_value.into()).unwrap();

        let method_key = v8::String::new(scope, "method").unwrap();
        let method_key = v8::Local::new(scope, method_key);
        let method_value = v8::String::new(scope, request.method.into()).unwrap();
        let method_value = v8::Local::new(scope, method_value);
        request_param.set(scope, method_key.into(), method_value.into()).unwrap();

        let body_key = v8::String::new(scope, "body").unwrap();
        let body_key = v8::Local::new(scope, body_key);
        let body_value = v8::String::new(scope, &request.body).unwrap();
        let body_value = v8::Local::new(scope, body_value);
        request_param.set(scope, body_key.into(), body_value.into()).unwrap();

        let headers_key = v8::String::new(scope, "headers").unwrap();
        let headers_key = v8::Local::new(scope, headers_key);

        let request_headers = v8::Object::new(scope);

        for (key, value) in request.headers.iter() {
            let key = v8::String::new(scope, key).unwrap();
            let key = v8::Local::new(scope, key);
            let value = v8::String::new(scope, value).unwrap();
            let value = v8::Local::new(scope, value);
            request_headers.set(scope, key.into(), value.into());
        }

        request_param.set(scope, headers_key.into(), request_headers.into()).unwrap();

        let handler = self.handler.as_ref().unwrap();
        let handler = handler.open(scope);

        let global = state.global_context.open(scope);
        let try_catch = &mut v8::TryCatch::new(scope);
        let global = global.global(try_catch);

        let now = Instant::now();

        match handler.call(try_catch, global.into(), &[request_param.into()]) {
            Some(result) => {
                let response = extract_v8_string(result, try_catch).unwrap();

                RunResult::Response(
                    Response {
                        headers: None,
                        body: response,
                        status: 200,
                    },
                    now.elapsed(),
                )
            }
            None => {
                let exception = try_catch.exception().unwrap();

                match extract_v8_string(exception, try_catch) {
                    Some(error) => RunResult::Error(error),
                    // Can be caused by memory limit being reached, or maybe by something else?
                    None => {
                        let exception_message = v8::Exception::create_message(try_catch, exception);
                        let exception_message = exception_message
                            .get(try_catch)
                            .to_rust_string_lossy(try_catch);

                        // if count.load(Ordering::SeqCst) >= memory_mb {
                        //     RunResult::MemoryLimit()
                        // } else {
                        // println!("{:?}", exception.to_object(try_catch).unwrap().get_property_names(try_catch).unwrap());
                        RunResult::Error(exception_message)
                        // }
                    }
                }
            }
        }
    }
}
