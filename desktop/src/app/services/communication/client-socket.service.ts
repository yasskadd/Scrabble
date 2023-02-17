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

    private useTauriSocket: boolean;

    constructor() {
        this.updateSubject = new Subject<void>();
        this.useTauriSocket = window.__TAURI_IPC__ ? true : false;

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
        if (this.useTauriSocket) {
            tauri.tauri.invoke(RustSocketCommand.EstablishConnection, { address: environment.serverUrl }).then();
        } else if (!this.isSocketAlive()) {
            this.connect();
        }
    }

    disconnect() {
        if (this.useTauriSocket) {
            tauri.tauri.invoke(RustSocketCommand.Disconnect).then();
        } else {
            this.socket.disconnect();
        }
    }

    on<T>(eventName: string, action: (data: T) => void): void {
        if (this.useTauriSocket) {
            tauri.event
                .listen(eventName, (event) => {
                    action(JSON.parse(event.payload as string));
                    this.updateSubject.next();
                })
                .then();
        } else {
            this.socket.on(eventName, action);
        }
    }

    send<T>(event: string, data?: T): void {
        if (this.useTauriSocket) {
            if (data) {
                tauri.tauri.invoke(RustSocketCommand.Send, { eventName: event, data: JSON.stringify(data) }).then();
            } else {
                tauri.tauri.invoke(RustSocketCommand.Send, { eventName: event }).then();
            }
        } else {
            if (data) {
                this.socket.emit(event, data);
            } else {
                this.socket.emit(event);
            }
        }
    }
}
