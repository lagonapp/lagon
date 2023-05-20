use hyper::Request;
use lagon_runtime_isolate::options::IsolateOptions;
use lagon_runtime_websocket::{accept_async, Message, StreamExt, WebSocketStream};
use tokio::{
    io::{AsyncRead, AsyncWrite},
    net::TcpListener,
};

mod utils;

async fn run_connection<S>(
    connection: WebSocketStream<S>,
    msg_tx: futures_channel::oneshot::Sender<Vec<Message>>,
) where
    S: AsyncRead + AsyncWrite + Unpin,
{
    let mut connection = connection;
    let mut messages = vec![];
    while let Some(message) = connection.next().await {
        let message = message.expect("Failed to get message");
        messages.push(message);
    }
    msg_tx.send(messages).expect("Failed to send results");
}

#[tokio::test]
async fn websocket_test() {
    utils::setup();

    let (con_tx, con_rx) = futures_channel::oneshot::channel();
    let (msg_tx, msg_rx) = futures_channel::oneshot::channel();

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

    let (send, _) = utils::create_isolate(IsolateOptions::new(
        "export async function handler() {
        const ws = new WebSocket('ws://localhost:12345/');

        await new Promise((res) => {
          ws.addEventListener('open', () => {
            ws.send('test_ws');
            ws.close();
            // TODO: If you add this line, it will always block, but the correct logic is that if you don’t add this line, it will always block. I don’t understand why
            // res();
          });
        });
      
        return new Response('');
      }"
        .into(),
    ));
    send(Request::default());

    let messages = msg_rx.await.expect("Failed to receive messages");

    assert_eq!(messages[0], Message::Text("test_ws".to_string()));
}
