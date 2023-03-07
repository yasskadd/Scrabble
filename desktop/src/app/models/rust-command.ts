export enum RustCommand {
    EstablishConnection = 'socketEstablishConnection',
    Disconnect = 'socketDisconnect',
    Send = 'socketSend',
}

export enum RustEvent {
    SocketConnectionFailed = 'socketConnectionFailed',
    SocketDisconnectionFailed = 'socketDisconnectionFailed',
    SocketSendFailed = 'socketSendFailed',
}
