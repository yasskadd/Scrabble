export enum RustCommand {
    EstablishConnection = 'socketEstablishConnection',
    Disconnect = 'socketDisconnect',
    Send = 'socketSend',
    IsSocketAlive = 'isSocketAlive',
}

export enum RustEvent {
    SocketConnectionFailed = 'socketConnectionFailed',
    SocketDisconnectionFailed = 'socketDisconnectionFailed',
    SocketSendFailed = 'socketSendFailed',
    SocketAlive = 'socketAlive',
    SocketNotAlive = 'socketNotAlive',
}
