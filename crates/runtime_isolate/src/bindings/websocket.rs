use std::{collections::BTreeMap, sync::Arc};

use anyhow::Result;
use lagon_runtime_v8_utils::v8_string;
use lagon_runtime_websocket::{new_ws, SendValue, Uuid, Ws, WsId};
use tokio::sync::Mutex;
use v8::{Local, ObjectTemplate};

use crate::Isolate;

use super::{BindingResult, PromiseResult};

type CreateArg = (String, String);
type EventArg = String;
type SendArg = (String, SendValue);
type CloseArg = (String, Option<u16>, Option<String>);

pub struct WSResourceTable {
    pub table: Arc<Mutex<BTreeMap<WsId, Ws>>>,
}

impl WSResourceTable {
    pub fn new(table: Arc<Mutex<BTreeMap<WsId, Ws>>>) -> Self {
        Self { table }
    }
}

macro_rules! async_ws_binding {
    ($scope: ident, $lagon_object: ident, $name: literal, $init: expr, $binding: expr) => {
        let binding = |scope: &mut v8::HandleScope,
                       args: v8::FunctionCallbackArguments,
                       mut retval: v8::ReturnValue| {
            let promise = v8::PromiseResolver::new(scope).unwrap();
            retval.set(promise.into());

            let isolate_state = Isolate::state(scope);
            let mut state = isolate_state.borrow_mut();
            let id = state.js_promises.len() + 1;

            let global_promise = v8::Global::new(scope, promise);
            state.js_promises.insert(id, global_promise);

            drop(state);

            match $init(scope, args) {
                Ok(args) => {
                    let mut state = isolate_state.borrow_mut();
                    let table = &mut state.ws_resource_table.table;
                    let future = $binding(Arc::clone(table), id, args);

                    state.promises.push(Box::pin(future));
                }
                Err(error) => {
                    let error = v8_string(scope, &error.to_string());
                    promise.reject(scope, error.into());
                }
            }
        };

        $lagon_object.set(
            v8_string($scope, $name).into(),
            v8::FunctionTemplate::new($scope, binding).into(),
        );
    };
}

pub fn create_websocket_init(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
) -> Result<CreateArg> {
    let url = args.get(0).to_rust_string_lossy(scope);
    let protocols = args.get(1).to_rust_string_lossy(scope);

    Ok((url, protocols))
}

pub async fn create_websocket_binding<'a>(
    table: Arc<Mutex<BTreeMap<WsId, Ws>>>,
    id: usize,
    arg: CreateArg,
) -> BindingResult {
    let url = arg.0;
    let protocols = arg.1;

    let res = new_ws(url, protocols).await;

    let mut table = table.lock().await;

    match res {
        Ok((ws, protocols, extensions)) => {
            let ws_id = ws.get_id().to_string();

            table.insert(ws.get_id(), ws);
            return BindingResult {
                id,
                result: PromiseResult::WsInfo(ws_id, protocols, extensions),
            };
        }
        Err(error) => BindingResult {
            id,
            result: PromiseResult::Error(error.to_string()),
        },
    }
}

pub fn websocket_event_init(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
) -> Result<EventArg> {
    let ws_id = args.get(0).to_rust_string_lossy(scope);

    Ok(ws_id)
}

pub async fn websocket_event_binding(
    table: Arc<Mutex<BTreeMap<WsId, Ws>>>,
    id: usize,
    ws_id: EventArg,
) -> BindingResult {
    let mut table = table.lock().await;

    let uuid = match Uuid::parse_str(&ws_id) {
        Ok(uuid) => uuid,
        Err(error) => {
            return BindingResult {
                id,
                result: PromiseResult::Error(error.to_string()),
            }
        }
    };

    let ws = table.get_mut(&uuid);

    match ws {
        Some(ws) => match ws.get_ws_event().await {
            Ok(res) => match res {
                lagon_runtime_websocket::EventResponse::String(str) => BindingResult {
                    id,
                    result: PromiseResult::String(str),
                },
                lagon_runtime_websocket::EventResponse::Binary(buf) => BindingResult {
                    id,
                    result: PromiseResult::ArrayBuffer(buf),
                },
                lagon_runtime_websocket::EventResponse::Close { code, reason } => {
                    match ws.close_ws(Some(code), Some(reason)).await {
                        Ok(_) => BindingResult {
                            id,
                            result: PromiseResult::String(
                                "__RUNTIME_WS_EVENT_CLOSING__".to_string(),
                            ),
                        },
                        Err(error) => BindingResult {
                            id,
                            result: PromiseResult::Error(error.to_string()),
                        },
                    }
                }
                lagon_runtime_websocket::EventResponse::Ping => BindingResult {
                    id,
                    result: PromiseResult::String("__RUNTIME_WS_EVENT_PING__".to_string()),
                },
                lagon_runtime_websocket::EventResponse::Pong => BindingResult {
                    id,
                    result: PromiseResult::String("__RUNTIME_WS_EVENT_PONG__".to_string()),
                },
                lagon_runtime_websocket::EventResponse::Error(error) => BindingResult {
                    id,
                    result: PromiseResult::Error(error),
                },
                lagon_runtime_websocket::EventResponse::Closed => BindingResult {
                    id,
                    result: PromiseResult::String("__RUNTIME_WS_EVENT_CLOSED__".to_string()),
                },
            },
            Err(error) => BindingResult {
                id,
                result: PromiseResult::Error(error.to_string()),
            },
        },
        None => BindingResult {
            id,
            result: PromiseResult::Error(format!("Could not find this websocket")),
        },
    }
}

pub fn websocket_send_init(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
) -> Result<SendArg> {
    let ws_id = args.get(0).to_rust_string_lossy(scope);
    let value = {
        let v = args.get(1);
        if v.is_string() {
            let value = v.to_rust_string_lossy(scope);
            if value == "__RUNTIME_PING__".to_string() {
                SendValue::Ping
            } else if value == "__RUNTIME_PONG__".to_string() {
                SendValue::Pong
            } else {
                SendValue::Text(v.to_rust_string_lossy(scope).to_string())
            }
        } else if v.is_array_buffer() {
            let chunk = unsafe { v8::Local::<v8::Uint8Array>::cast(v) };
            let mut buf = vec![0; chunk.byte_length()];
            chunk.copy_contents(&mut buf);
            SendValue::Binary(buf)
        } else {
            SendValue::Text("".to_string())
        }
    };

    Ok((ws_id, value))
}

pub async fn websocket_send_binding(
    table: Arc<Mutex<BTreeMap<WsId, Ws>>>,
    id: usize,
    arg: SendArg,
) -> BindingResult {
    let ws_id = arg.0;
    let value = arg.1;

    let mut table = table.lock().await;

    let uuid = match Uuid::parse_str(&ws_id) {
        Ok(uuid) => uuid,
        Err(error) => {
            return BindingResult {
                id,
                result: PromiseResult::Error(error.to_string()),
            }
        }
    };

    let ws = table.get_mut(&uuid);

    match ws {
        Some(ws) => match ws.send_ws_event(value).await {
            Ok(_) => BindingResult {
                id,
                result: PromiseResult::Undefined,
            },
            Err(error) => BindingResult {
                id,
                result: PromiseResult::Error(error.to_string()),
            },
        },
        None => BindingResult {
            id,
            result: PromiseResult::Error(format!("Could not find this websocket")),
        },
    }
}

pub fn websocket_close_init(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
) -> Result<CloseArg> {
    let ws_id = args.get(0).to_rust_string_lossy(scope);
    let code = {
        let v = args.get(1);
        match v.to_uint32(scope) {
            Some(value) => Some(value.value() as u16),
            None => None,
        }
    };

    let reason = {
        let v = args.get(2);
        if v.is_string() {
            Some(v.to_rust_string_lossy(scope))
        } else {
            None
        }
    };

    Ok((ws_id, code, reason))
}

pub async fn websocket_close_binding(
    table: Arc<Mutex<BTreeMap<WsId, Ws>>>,
    id: usize,
    arg: CloseArg,
) -> BindingResult {
    let ws_id = arg.0;
    let code = arg.1;
    let reason = arg.2;

    let mut table = table.lock().await;

    let uuid = match Uuid::parse_str(&ws_id) {
        Ok(uuid) => uuid,
        Err(error) => {
            return BindingResult {
                id,
                result: PromiseResult::Error(error.to_string()),
            }
        }
    };

    match table.remove(&uuid) {
        Some(ref mut ws) => match ws.close_ws(code, reason).await {
            Ok(_) => BindingResult {
                id,
                result: PromiseResult::Undefined,
            },
            Err(error) => BindingResult {
                id,
                result: PromiseResult::Error(error.to_string()),
            },
        },
        None => BindingResult {
            id,
            result: PromiseResult::Error(format!("Could not find this websocket")),
        },
    }
}

pub fn ws_info_to_v8<'a>(
    ws_info: (String, String, String),
    scope: &mut v8::HandleScope<'a>,
) -> v8::Local<'a, v8::Object> {
    let len = 3;
    let mut names = Vec::with_capacity(len);
    let mut values = Vec::with_capacity(len);

    names.push(v8_string(scope, "wsId").into());
    values.push(v8_string(scope, &ws_info.0).into());

    names.push(v8_string(scope, "protocols").into());
    values.push(v8_string(scope, &ws_info.1).into());

    names.push(v8_string(scope, "extensions").into());
    values.push(v8_string(scope, &ws_info.2).into());

    let null = v8::null(scope).into();
    v8::Object::with_prototype_and_properties(scope, null, &names, &values)
}

pub fn ws_init<'a>(scope: &mut v8::HandleScope<'a, ()>, lagon_object: &Local<ObjectTemplate>) {
    async_ws_binding!(
        scope,
        lagon_object,
        "createWebsocket",
        create_websocket_init,
        create_websocket_binding
    );

    async_ws_binding!(
        scope,
        lagon_object,
        "websocketEvent",
        websocket_event_init,
        websocket_event_binding
    );

    async_ws_binding!(
        scope,
        lagon_object,
        "websocketSend",
        websocket_send_init,
        websocket_send_binding
    );

    async_ws_binding!(
        scope,
        lagon_object,
        "websocketClose",
        websocket_close_init,
        websocket_close_binding
    );
}
