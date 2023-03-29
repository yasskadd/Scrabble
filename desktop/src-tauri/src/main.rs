#![allow(non_snake_case)]
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::fs;
use std::sync::Mutex;

use reqwest;
use rust_socketio::{client::Client, ClientBuilder, Payload};
use serde_json::json;

struct SocketClient {
    socket: Mutex<Option<Client>>,
}

enum RustEvent {
    SocketConnectionFailed,
    SocketDisconnectionFailed,
    SocketSendFailed,
    SocketAlive,
    SocketNotAlive,
}

impl RustEvent {
    pub fn to_string(&self) -> &'static str {
        match self {
            Self::SocketConnectionFailed => "socketConnectionFailed",
            Self::SocketDisconnectionFailed => "socketDisconnectionFailed",
            Self::SocketSendFailed => "socketSendFailed",
            Self::SocketAlive => "socketAlive",
            Self::SocketNotAlive => "socketNotAlive",
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
    cookie: Option<&str>,
    state: tauri::State<SocketClient>,
    window: tauri::Window,
) {
    let mut socket = state.socket.lock().expect("Error locking the socket");

    if socket.is_some() {
        let disconnect = match socket.take() {
            None => return,
            Some(socket_client) => socket_client.disconnect(),
        };

        match disconnect {
            Ok(()) => {
                println!("Disconnected from socket");
            }
            Err(error) => {
                window
                    .emit(
                        RustEvent::SocketDisconnectionFailed.to_string(),
                        error.to_string(),
                    )
                    .expect("oups");
            }
        }
        return;
    }

    let socketEventWindow = window.clone();
    let clientBuilder = match cookie {
        Some(c) => ClientBuilder::new(address).opening_header("Cookie", c),
        None => ClientBuilder::new(address),
    };

    let connection = clientBuilder
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
            println!("Connected to socket");
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
fn socketDisconnect(state: tauri::State<SocketClient>, window: tauri::Window) {
    let mut socket = state.socket.lock().expect("Error locking the socket");

    let disconnect = match socket.take() {
        None => return,
        Some(socket_client) => socket_client.disconnect(),
    };

    match disconnect {
        Ok(()) => {
            println!("Disconnected from socket");
        }
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

#[tauri::command]
fn socketSend(
    eventName: &str,
    data: Option<&str>,
    state: tauri::State<SocketClient>,
    window: tauri::Window,
) {
    let socket = state.socket.lock().expect("Error locking the socket");

    let send = match &*socket {
        Some(s) => s.emit(eventName, data.unwrap_or("")),
        None => return,
    };

    match send {
        Ok(()) => (),
        Err(error) => window
            .emit(RustEvent::SocketSendFailed.to_string(), error.to_string())
            .expect("oups"),
    }
}

#[tauri::command]
fn isSocketAlive(state: tauri::State<SocketClient>) -> String {
    let socket = state.socket.lock().expect("Error locking the socket");

    match &*socket {
        Some(_s) => RustEvent::SocketAlive.to_string().into(),
        None => RustEvent::SocketNotAlive.to_string().into(),
    }
}

#[tauri::command]
async fn loginTest(handle: tauri::AppHandle) -> String {
    let resource_path = handle
        .path_resolver()
        .resolve_resource("../certs/server.pem")
        .expect("failed to resolve resource");

    let cert = fs::read(resource_path).expect("error opening the cert");
    let certificate =
        reqwest::Certificate::from_pem(&cert).expect("Error creating the cert object");

    let client = reqwest::Client::builder()
        .danger_accept_invalid_certs(true)
        .add_root_certificate(certificate)
        .build()
        .expect("http client build failed");

    let res = client
        .post("https://ec2-35-183-107-112.ca-central-1.compute.amazonaws.com:3443/auth/login")
        // .post("https://localhost:3443/auth/login")
        .json(&json!({
            "username": "test",
            "password": "test",
        }))
        .send()
        .await
        .unwrap()
        .text()
        .await;

    match res {
        Ok(response) => {
            println!("{}", response);
            return response;
        }
        Err(error) => error.to_string().into(),
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
            socketSend,
            isSocketAlive,
            loginTest
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
