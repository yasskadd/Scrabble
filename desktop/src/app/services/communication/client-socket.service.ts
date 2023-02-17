import { Injectable, OnDestroy } from '@angular/core';
import { RustSocketCommand } from '@app/models/rust-socket-command';
import * as tauri from '@tauri-apps/api';
import { Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class ClientSocketService implements OnDestroy {
    updateSubject: Subject<void>;
    private socket: Socket;

    constructor() {
        this.updateSubject = new Subject<void>();
        this.establishConnection();
    }

    ngOnDestroy(): void {
        this.disconnect();
    }

    isSocketAlive() {
        return this.socket && this.socket.connected;
    }

    connect() {
        this.socket = io(environment.serverUrl, { transports: ['websocket'], upgrade: false });
    }

    establishConnection() {
        tauri.tauri.invoke(RustSocketCommand.EstablishConnection, { address: environment.serverUrl });
        // console.log(tauri.invoke('greet', { name: 'test' }));
        // if (!this.isSocketAlive()) {
        //     this.connect();
        // }
    }

    disconnect() {
        tauri.tauri.invoke(RustSocketCommand.Disconnect);
        // this.socket.disconnect();
    }

    on<T>(eventName: string, action: (data: T) => void): void {
        // this.socket.on(event, action);
        tauri.event.listen(eventName, (event) => {
            action(JSON.parse(event.payload as string));
            this.updateSubject.next();
        });
    }

    send<T>(event: string, data?: T): void {
        if (data) {
            tauri.tauri.invoke(RustSocketCommand.Send, { eventName: event, data: JSON.stringify(data) });
            // this.socket.emit(event, data);
        } else {
            tauri.tauri.invoke(RustSocketCommand.Send, { eventName: event });
            // this.socket.emit(event);
        }
    }
}
