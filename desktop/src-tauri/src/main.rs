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

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn socketEstablishConnection(
    address: &str,
    socketClient: tauri::State<SocketClient>,
    window: tauri::Window,
) {
    let mut socket = socketClient.socket.lock().expect("Couldn't get the lock");
    if socket.is_some() {
        return;
    }
    let client = ClientBuilder::new(address)
        .on_any(move |event, payload, _raw_client| {
            // println!("Got event: {:?} {:?}", event, payload);
            if let Payload::String(payload) = payload {
                println!("Got payload: {}", payload);
                window
                    .emit(&String::from(event), payload)
                    .expect("Couldn't emit the event to Angular");
            }
        })
        .connect()
        .expect("Failed to connect to socket");

    *socket = Some(client);
}

#[tauri::command]
fn socketDisconnect(socketClient: tauri::State<SocketClient>) {
    let client = socketClient.socket.lock().expect("Couldn't get the lock");
    if let Some(socket_client) = &*client {
        socket_client
            .disconnect()
            .expect("Couldn't disconnect from socket");
        println!("Disconnected from socket");
    }
}

#[tauri::command]
fn socketSend(eventName: &str, data: Option<&str>, socketClient: tauri::State<SocketClient>) {
    let client = socketClient.socket.lock().expect("Couldn't get the lock");
    if let Some(socket_client) = &*client {
        socket_client
            .emit(eventName, data.unwrap_or(""))
            .expect("Couldn't emit the socket event");
    }
}

fn main() {
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
