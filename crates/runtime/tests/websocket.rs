use hyper::{header::CONTENT_TYPE, Body, Request, Response};
use lagon_runtime_isolate::options::IsolateOptions;
use lagon_runtime_websocket::{accept_async, Message, SinkExt, StreamExt, WebSocketStream};
use tokio::{
    io::{AsyncRead, AsyncWrite},
    net::TcpListener,
};

mod utils;

async fn run_connection<S>(
    connection: WebSocketStream<S>,
    msg_tx: tokio::sync::oneshot::Sender<Vec<Message>>,
) where
    S: AsyncRead + AsyncWrite + Unpin,
{
    let mut connection = connection;
    let mut messages = vec![];
    while let Some(message) = connection.next().await {
        let message = message.expect("Failed to get message");
        println!("message: {}", message.clone());
        match message {
            Message::Text(_) => {
                connection
                    .send(Message::Text("server received message".to_string()))
                    .await
                    .expect("Failed to send message");
            }
            _ => {}
        }
        messages.push(message);
    }

    msg_tx
        .send(messages.clone())
        .expect("Failed to send results");
}

#[tokio::test]
async fn websocket_test() {
    utils::setup();

    let (con_tx, con_rx) = tokio::sync::oneshot::channel();
    let (msg_tx, msg_rx) = tokio::sync::oneshot::channel();

    let f = async move {
        let listener = TcpListener::bind("127.0.0.1:12345").await.unwrap();
        con_tx.send(()).unwrap();
        let (connection, _) = listener.accept().await.expect("No connections to accept");
        let stream = accept_async(connection).await;
        let stream = stream.expect("Failed to handshake with connection");
        run_connection(stream, msg_tx).await;
    };

    tokio::spawn(f);

    con_rx.await.expect("Server not ready");

    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export async function handler() {
        const ws = new WebSocket('ws://localhost:12345/');
        let resMsg = ''

        await new Promise((res) => {
            ws.onopen(() => {
                ws.send('test_ws');
            });

            ws.onmessage((event) => {
                resMsg = event.data;

                ws.close();
            });

            ws.onclose(() => {
                res();
            })
        });
        
        return new Response(resMsg);
      }"
        .into(),
    ));
    send(Request::default());

    let messages = msg_rx.await.expect("Failed to receive messages");

    assert_eq!(messages[0], Message::Text("test_ws".to_string()));

    utils::assert_response(
        &receiver,
        Response::builder().header(CONTENT_TYPE, "text/plain;charset=UTF-8"),
        Body::from("server received message"),
    )
    .await;
}
