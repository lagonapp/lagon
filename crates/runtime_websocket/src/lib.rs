use anyhow::{anyhow, Result};
use futures::stream::{SplitSink, SplitStream};
use http::{Method, Request, Uri};
use rustls::ServerName;
use std::borrow::Cow;
use std::fs::File;
use std::io::BufReader;
use std::path::Path;
use std::sync::Arc;
use tokio::net::TcpStream;
use tokio_rustls::rustls::{self, ClientConfig, RootCertStore};
use tokio_rustls::TlsConnector;
use tokio_tungstenite::tungstenite::protocol::frame::coding::CloseCode;
use tokio_tungstenite::tungstenite::protocol::{CloseFrame, WebSocketConfig};
use tokio_tungstenite::{client_async_with_config, MaybeTlsStream};

pub use futures::{SinkExt, StreamExt};
pub use tokio_tungstenite::tungstenite::Message;
pub use tokio_tungstenite::{accept_async, WebSocketStream};
pub use uuid::Uuid;

type WsStream = WebSocketStream<MaybeTlsStream<TcpStream>>;

pub type WsId = Uuid;

#[derive(Debug)]
pub enum SendValue {
    Text(String),
    Binary(Vec<u8>),
    Pong,
    Ping,
}

#[derive(Debug)]
pub enum EventResponse {
    String(String),
    Binary(Vec<u8>),
    Close { code: u16, reason: String },
    Ping,
    Pong,
    Error(String),
    Closed,
}

#[derive(Debug)]
pub struct Ws {
    id: Uuid,
    tx: SplitSink<WsStream, Message>,
    rx: SplitStream<WsStream>,
}

impl Ws {
    pub fn new(tx: SplitSink<WsStream, Message>, rx: SplitStream<WsStream>) -> Self {
        let uuid = Uuid::new_v4();

        Self { id: uuid, tx, rx }
    }

    pub fn get_id(&self) -> Uuid {
        self.id
    }

    async fn send(&mut self, message: Message) -> Result<()> {
        let res = self.tx.send(message).await;

        match res {
            Ok(()) => Ok(()),
            Err(tokio_tungstenite::tungstenite::Error::ConnectionClosed) => Ok(()),
            Err(tokio_tungstenite::tungstenite::Error::Protocol(
                tokio_tungstenite::tungstenite::error::ProtocolError::SendAfterClosing,
            )) => Ok(()),
            Err(err) => Err(err.into()),
        }
    }

    async fn next_message(
        &mut self,
    ) -> Result<Option<Result<Message, tokio_tungstenite::tungstenite::Error>>> {
        let res = self.rx.next().await;
        Ok(res)
    }

    async fn close(&mut self) {
        self.tx.close().await;
    }

    pub async fn get_ws_event(&mut self) -> Result<EventResponse> {
        let val = self.next_message().await?;
        let res = match val {
            Some(Ok(Message::Text(text))) => EventResponse::String(text),
            Some(Ok(Message::Binary(data))) => EventResponse::Binary(data.into()),
            Some(Ok(Message::Close(Some(frame)))) => EventResponse::Close {
                code: frame.code.into(),
                reason: frame.reason.to_string(),
            },
            Some(Ok(Message::Close(None))) => EventResponse::Close {
                code: 1005,
                reason: String::new(),
            },
            Some(Ok(Message::Ping(_))) => EventResponse::Ping,
            Some(Ok(Message::Pong(_))) => EventResponse::Pong,
            Some(Err(e)) => EventResponse::Error(e.to_string()),
            None => EventResponse::Closed,
        };

        Ok(res)
    }

    pub async fn send_ws_event(&mut self, value: SendValue) -> Result<()> {
        let msg = match value {
            SendValue::Text(text) => Message::Text(text),
            SendValue::Binary(buf) => Message::Binary(buf.to_vec()),
            SendValue::Pong => Message::Pong(vec![]),
            SendValue::Ping => Message::Ping(vec![]),
        };

        self.send(msg).await?;

        Ok(())
    }

    pub async fn close_ws(&mut self, code: Option<u16>, reason: Option<String>) -> Result<()> {
        let msg = Message::Close(code.map(|c| CloseFrame {
            code: CloseCode::from(c),
            reason: match reason {
                Some(reason) => Cow::from(reason),
                None => Default::default(),
            },
        }));

        self.send(msg).await?;

        self.close().await;
        Ok(())
    }
}

pub fn create_default_root_cert_store() -> RootCertStore {
    let mut root_cert_store = RootCertStore::empty();
    root_cert_store.add_server_trust_anchors(webpki_roots::TLS_SERVER_ROOTS.0.iter().map(|ta| {
        rustls::OwnedTrustAnchor::from_subject_spki_name_constraints(
            ta.subject,
            ta.spki,
            ta.name_constraints,
        )
    }));
    root_cert_store
}

pub async fn new_ws(url: String, protocol: String) -> Result<(Ws, String, String)> {
    let uri: Uri = url.parse()?;
    let mut request = Request::builder().method(Method::GET).uri(&uri);

    request = request.header("User-Agent", "Lagon/serverless rusty_v8/0.71.2");
    println!("protocol: {:?}", protocol);
    if !protocol.is_empty() {
        request = request.header("Sec-WebSocket-Protocol", protocol);
    }

    let request = request.body(())?;
    let domain = &uri.host().unwrap().to_string();
    let port = &uri.port_u16().unwrap_or(match uri.scheme_str() {
        Some("wss") => 443,
        Some("ws") => 80,
        _ => unreachable!(),
    });
    let addr = format!("{}:{}", domain, port);

    let tcp_socket = TcpStream::connect(addr).await?;

    let socket: MaybeTlsStream<TcpStream> = match uri.scheme_str() {
        Some("ws") => MaybeTlsStream::Plain(tcp_socket),
        Some("wss") => {
            let mut root_cert_store = create_default_root_cert_store();
            let f = File::open(Path::new("/etc/ssl/certs/ca-certificates.crt"))?;
            let mut f = BufReader::new(f);
            match rustls_pemfile::certs(&mut f) {
                Ok(certs) => {
                    root_cert_store.add_parsable_certificates(&certs);
                }
                Err(_) => return Err(anyhow!("Could not load PEM file")),
            }
            let client_config = ClientConfig::builder()
                .with_safe_defaults()
                .with_root_certificates(root_cert_store);
            let tls_config = client_config.with_no_client_auth();
            let tls_connector = TlsConnector::from(Arc::new(tls_config));
            let dnsname = ServerName::try_from(domain.as_str())
                .map_err(|_| anyhow!("Invalid hostname: '{}'", domain))?;
            let tls_socket = tls_connector.connect(dnsname, tcp_socket).await?;
            MaybeTlsStream::Rustls(tls_socket)
        }
        _ => unreachable!(),
    };

    let client = client_async_with_config(
        request,
        socket,
        Some(WebSocketConfig {
            max_message_size: Some(128 << 20),
            max_frame_size: Some(32 << 20),
            ..Default::default()
        }),
    );

    let (stream, response) = client
        .await
        .map_err(|err| anyhow!(format!("failed to connect to WebSocket: {}", err)))?;

    let (ws_tx, ws_rx) = stream.split();

    let ws = Ws::new(ws_tx, ws_rx);

    let protocol = match response.headers().get("Sec-WebSocket-Protocol") {
        Some(header) => header.to_str().unwrap(),
        None => "",
    };

    let extensions = response
        .headers()
        .get_all("Sec-WebSocket-Extensions")
        .iter()
        .map(|header| header.to_str().unwrap())
        .collect::<String>();

    Ok((ws, protocol.into(), extensions))
}
