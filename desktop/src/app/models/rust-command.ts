export enum RustCommand {
    EstablishConnection = 'socketEstablishConnection',
    Disconnect = 'socketDisconnect',
    Send = 'socketSend',
    IsSocketAlive = 'isSocketAlive',
    ChatWindowListening = 'chatWindowListening',
    ChatWindowUnlistening = 'chatWindowUnlistening',
}

export enum RustEvent {
    SocketConnectionFailed = 'socketConnectionFailed',
    SocketDisconnectionFailed = 'socketDisconnectionFailed',
    SocketSendFailed = 'socketSendFailed',
    SocketAlive = 'socketAlive',
    SocketNotAlive = 'socketNotAlive',
    WindowEvent = 'windowEvent',
    UserData = 'userData',
    ChatRooms = 'charRooms',
}
