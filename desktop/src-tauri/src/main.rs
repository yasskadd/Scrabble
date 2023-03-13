#![allow(non_snake_case)]
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use rust_socketio::{client::Client, ClientBuilder, Payload};
use std::sync::Mutex;

struct SocketClient {
    socket: Mutex<Option<Client>>,
}

enum RustEvent {
    SocketConnectionFailed,
    SocketDisconnectionFailed,
    SocketSendFailed,
}

impl RustEvent {
    pub fn to_string(&self) -> &'static str {
        match self {
            Self::SocketConnectionFailed => "socketConnectionFailed",
            Self::SocketDisconnectionFailed => "socketDisconnectionFailed",
            Self::SocketSendFailed => "socketSendFailed",
        }
    }
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn socketEstablishConnection(
    address: &str,
    cookie: &str,
    socketClient: tauri::State<SocketClient>,
    window: tauri::Window,
) {
    let mut socket = socketClient.socket.lock().expect("Couldn't get the lock");
    if socket.is_some() {
        return;
    }
    let socketEventWindow = window.clone();
    let connection = ClientBuilder::new(address)
        .opening_header("Cookie", cookie)
        .on_any(move |event, payload, _raw_client| {
            // println!("Got event: {:?} {:?}", event, payload);
            if let Payload::String(payload) = payload {
                println!("Got payload: {}", payload);
                socketEventWindow
                    .emit(&String::from(event), payload)
                    .expect("Couldn't emit the event to Angular");
            }
        })
        .connect();

    match connection {
        Ok(client) => {
            *socket = Some(client);
        }
        Err(error) => {
            window
                .emit(
                    RustEvent::SocketConnectionFailed.to_string(),
                    error.to_string(),
                )
                .expect("oups");
        }
    }
}

#[tauri::command]
fn socketDisconnect(socketClient: tauri::State<SocketClient>, window: tauri::Window) {
    let client = socketClient.socket.lock().expect("Couldn't get the lock");
    if let Some(socket_client) = &*client {
        let disconnection = socket_client.disconnect();
        println!("Disconnected from socket");

        match disconnection {
            Ok(..) => {}
            Err(error) => {
                window
                    .emit(
                        RustEvent::SocketDisconnectionFailed.to_string(),
                        error.to_string(),
                    )
                    .expect("oups");
            }
        }
    }
}

#[tauri::command]
fn socketSend(
    eventName: &str,
    data: Option<&str>,
    socketClient: tauri::State<SocketClient>,
    window: tauri::Window,
) {
    let client = socketClient.socket.lock().expect("Couldn't get the lock");
    if let Some(socket_client) = &*client {
        let send = socket_client.emit(eventName, data.unwrap_or(""));

        match send {
            Ok(..) => {}
            Err(error) => {
                window
                    .emit(RustEvent::SocketSendFailed.to_string(), error.to_string())
                    .expect("oups");
            }
        }
    }
}

fn main() {
    // std::env::set_var("RUST_BACKTRACE", "full");
    tauri::Builder::default()
        .manage(SocketClient {
            socket: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            socketEstablishConnection,
            socketDisconnect,
            socketSend
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
