#![allow(non_snake_case)]
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::fs;
use std::path::Path;
use std::sync::Mutex;

use reqwest::{self, header::CONTENT_TYPE};
use rust_socketio::{client::Client, ClientBuilder, Payload};
use serde::Serialize;
use tauri::{self, Manager};

struct SocketClient {
    socket: Mutex<Option<Client>>,
}
struct Http {
    client: reqwest::Client,
}
#[derive(Serialize)]
struct HttpResponse {
    body: String,
    err: String,
}

// the payload type must implement `Serialize` and `Clone`.
#[derive(Clone, serde::Serialize)]
struct TestPayload {
    message: String,
}

enum RustEvent {
    SocketConnectionFailed,
    SocketDisconnectionFailed,
    SocketSendFailed,
    SocketAlive,
    SocketNotAlive,
    WindowEvent,
    UserData,
}

impl RustEvent {
    pub fn to_string(&self) -> &'static str {
        match self {
            Self::SocketConnectionFailed => "socketConnectionFailed",
            Self::SocketDisconnectionFailed => "socketDisconnectionFailed",
            Self::SocketSendFailed => "socketSendFailed",
            Self::SocketAlive => "socketAlive",
            Self::SocketNotAlive => "socketNotAlive",
            Self::WindowEvent => "windowEvent",
            Self::UserData => "userData",
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
    handle: tauri::AppHandle,
) {
    let mut socket = state.socket.lock().expect("Error locking the socket");

    let clientBuilder = match cookie {
        Some(c) => {
            println!("Connecting to socket with cookie : {:?}", c);
            ClientBuilder::new(address)
                .opening_header("cookie", c)
                .reconnect(false)
        }
        None => ClientBuilder::new(address).reconnect(false),
    };

    let connection = clientBuilder
        .on_any(move |event, payload, _raw_client| {
            // println!("Got event: {:?} {:?}", event, payload);
            if let Payload::String(payload) = payload {
                println!("Got event: {}", String::from(event.clone()));
                // println!("Got payload: {}", payload);

                if payload.to_string() == "\"SuccessfulConnection\""
                    || payload.to_string() == "\"UserAlreadyConnected\""
                {
                    let new_payload = payload
                        .strip_prefix("\"")
                        .unwrap()
                        .strip_suffix("\"")
                        .unwrap();

                    let main_window = handle.get_window("main").unwrap();
                    main_window
                        .emit_all(&String::from(new_payload.clone()), payload.clone())
                        .expect("Couldn't emit the event to Angular");

                    let chat_window = handle.get_window("chat");
                    match chat_window {
                        Some(w) => w
                            .emit_all(&String::from(new_payload), payload.clone())
                            .unwrap(),
                        None => return,
                    }

                    handle
                        .emit_all(&String::from(new_payload.clone()), payload.clone())
                        .expect("Couldn't emit the event to Angular");
                } else {
                    println!("test");
                    let main_window = handle.get_window("main").unwrap();
                    main_window
                        .emit_all(&String::from(event.clone()), payload.clone())
                        .expect("Couldn't emit the event to Angular");

                    let chat_window = handle.get_window("chat");
                    match chat_window {
                        Some(w) => w
                            .emit_all(&String::from(event.clone()), payload.clone())
                            .unwrap(),
                        None => return,
                    }
                    handle
                        .emit_all(&String::from(event), payload)
                        .expect("Couldn't emit the event to Angular");
                }

                // socketEventWindow
                //     .emit(&String::from(event), payload)
                //     .expect("Couldn't emit the event to Angular");
            }
        })
        .connect();

    match connection {
        Ok(client) => {
            *socket = Some(client);
            println!("Connected to socket");
        }
        Err(error) => {
            println!("Error {error}");
            // window
            //     .emit(
            //         RustEvent::SocketConnectionFailed.to_string(),
            //         error.to_string(),
            //     )
            //     .expect("oups");
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

    *socket = None;

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
async fn httpGet(
    url: &str,
    body: Option<&str>,
    httpState: tauri::State<'_, Http>,
) -> Result<HttpResponse, String> {
    println!("GET request to : {url}");

    let mut req = httpState.client.get(url);

    req = match body {
        Some(body) => req
            .header(CONTENT_TYPE, "application/json")
            .body(body.to_owned()),
        None => req,
    };

    let res = req.send().await.unwrap().text().await;

    match res {
        Ok(response) => Ok(HttpResponse {
            body: response,
            err: "".to_string(),
        }),
        Err(error) => Ok(HttpResponse {
            body: "".to_string(),
            err: error.to_string(),
        }),
    }
}

#[tauri::command]
async fn httpPost(
    url: &str,
    once_told_me: Option<&str>,
    httpState: tauri::State<'_, Http>,
) -> Result<HttpResponse, String> {
    println!("POST request to : {url}");

    let mut req = httpState.client.post(url);

    if let Some(body) = once_told_me {
        req = req
            .header(CONTENT_TYPE, "application/json")
            .body(body.to_owned());
    }

    let res: Result<String, reqwest::Error> = req.send().await.unwrap().text().await;

    match res {
        Ok(response) => Ok(HttpResponse {
            body: response,
            err: "".to_string(),
        }),
        Err(error) => Ok(HttpResponse {
            body: "".to_string(),
            err: error.to_string(),
        }),
    }
}

#[tauri::command]
async fn httpPut(
    url: &str,
    once_told_me: Option<&str>,
    path: Option<&str>,
    httpState: tauri::State<'_, Http>,
) -> Result<HttpResponse, String> {
    println!("PUT request to : {url}");

    let mut req = httpState.client.put(url);

    if let Some(path) = path {
        let mut cache_dir = tauri::api::path::cache_dir().unwrap();
        cache_dir.push(path.to_owned());

        let file = fs::read(cache_dir.as_path());
        req = req.multipart(
            reqwest::multipart::Form::new().part(
                "image",
                reqwest::multipart::Part::bytes(file.unwrap())
                    .file_name(path.to_owned())
                    .mime_str(&format!(
                        "image/{}",
                        Path::new(&path).extension().unwrap().to_str().unwrap(),
                    ))
                    .unwrap(),
            ),
        );
    } else if let Some(body) = once_told_me {
        req = req
            .header(CONTENT_TYPE, "application/json")
            .body(body.to_owned());
    }

    let res: Result<String, reqwest::Error> = req.send().await.unwrap().text().await;

    match res {
        Ok(response) => Ok(HttpResponse {
            body: response,
            err: "".to_string(),
        }),
        Err(error) => Ok(HttpResponse {
            body: "".to_string(),
            err: error.to_string(),
        }),
    }
}

#[tauri::command]
async fn httpPatch(
    url: &str,
    once_told_me: Option<&str>,
    imageKey: Option<&str>,
    path: Option<&str>,
    httpState: tauri::State<'_, Http>,
) -> Result<HttpResponse, String> {
    println!("PATCH request to : {url}");

    let mut req = httpState.client.patch(url);

    if let Some(path) = path {
        if let Some(imageKey) = imageKey {
            let mut cache_dir = tauri::api::path::cache_dir().unwrap();
            cache_dir.push(path.to_owned());

            let file = fs::read(cache_dir.as_path());
            req = req.multipart(
                reqwest::multipart::Form::new()
                    .part(
                        "data",
                        reqwest::multipart::Part::bytes(file.unwrap())
                            .file_name(path.to_owned())
                            .mime_str(&format!(
                                "image/{}",
                                Path::new(&path).extension().unwrap().to_str().unwrap(),
                            ))
                            .unwrap(),
                    )
                    .part(
                        "imageKey",
                        reqwest::multipart::Part::text(imageKey.to_owned())
                            .mime_str(&format!("text/html"))
                            .unwrap(),
                    ),
            );
        }
    } else if let Some(body) = once_told_me {
        req = req
            .header(CONTENT_TYPE, "application/json")
            .body(body.to_owned());
    }

    let res: Result<String, reqwest::Error> = req.send().await.unwrap().text().await;

    match res {
        Ok(response) => Ok(HttpResponse {
            body: response,
            err: "".to_string(),
        }),
        Err(error) => Ok(HttpResponse {
            body: "".to_string(),
            err: error.to_string(),
        }),
    }
}

#[tauri::command]
async fn httpDelete(
    url: &str,
    once_told_me: Option<&str>,
    httpState: tauri::State<'_, Http>,
) -> Result<HttpResponse, String> {
    println!("DELETE request to : {url}");

    let mut req = httpState.client.delete(url);

    if let Some(body) = once_told_me {
        req = req
            .header(CONTENT_TYPE, "application/json")
            .body(body.to_owned());
    }

    let res: Result<String, reqwest::Error> = req.send().await.unwrap().text().await;

    match res {
        Ok(response) => Ok(HttpResponse {
            body: response,
            err: "".to_string(),
        }),
        Err(error) => Ok(HttpResponse {
            body: "".to_string(),
            err: error.to_string(),
        }),
    }
}

#[tauri::command]
async fn chatWindowListening(handle: tauri::AppHandle) {
    let listener = handle.get_window("chat").unwrap();

    let eventEmmitter = handle.get_window("main").unwrap();
    listener.listen_global(RustEvent::WindowEvent.to_string(), move |event| {
        println!("received {:?}", event);
        eventEmmitter
            .emit_all(RustEvent::WindowEvent.to_string(), event.payload())
            .unwrap();
    });

    let userDataEmitter = handle.get_window("chat").unwrap();
    listener.listen_global(RustEvent::UserData.to_string(), move |event| {
        userDataEmitter
            .emit(RustEvent::UserData.to_string(), event.payload())
            .unwrap();
    });
}

#[tauri::command]
async fn chatWindowUnlistening(handle: tauri::AppHandle) {
    let windowHandle = handle.get_window("chat").unwrap();
    handle
        .get_window("chat")
        .unwrap()
        .listen_global("windowEvent", move |event| {
            windowHandle.emit("windowEvent", event.payload()).unwrap();
        });
}

fn main() {
    std::env::set_var("RUST_BACKTRACE", "full");
    tauri::Builder::default()
        .manage(SocketClient {
            socket: Mutex::new(None),
        })
        .setup(|app| {
            let certificate: reqwest::Certificate = reqwest::Certificate::from_pem(
                &fs::read(
                    app.handle()
                        .path_resolver()
                        .resolve_resource("../certs/server.pem")
                        .expect("Error retriving the certificate file path"),
                )
                .expect("Error reading the certificate file"),
            )
            .expect("Error generating the certificate");

            app.manage(Http {
                client: reqwest::Client::builder()
                    .cookie_store(true)
                    .danger_accept_invalid_certs(true)
                    .add_root_certificate(certificate)
                    .build()
                    .expect("Error creating the http client"),
            });

            let windowHandle = app.handle().get_window("main").unwrap();
            windowHandle.get_window("main").unwrap().listen_global(
                RustEvent::WindowEvent.to_string(),
                move |event| {
                    windowHandle
                        .emit(RustEvent::WindowEvent.to_string(), event.payload())
                        .unwrap();
                },
            );

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            socketEstablishConnection,
            socketDisconnect,
            socketSend,
            isSocketAlive,
            httpGet,
            httpPost,
            httpPut,
            httpPatch,
            httpDelete,
            chatWindowListening,
            chatWindowUnlistening
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
