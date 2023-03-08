import { Injectable, OnDestroy } from '@angular/core';
import { RustCommand, RustEvent } from '@app/models/rust-command';
import { LanguageService } from '@services/language.service';
import { SnackBarService } from '@services/snack-bar.service';
import * as tauri from '@tauri-apps/api';
import { Event } from '@tauri-apps/api/event';
import { Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class ClientSocketService implements OnDestroy {
    updateSubject: Subject<void>;
    private socket: Socket;

    private readonly useTauriSocket: boolean;

    constructor(private snackBarService: SnackBarService, private languageService: LanguageService) {
        this.updateSubject = new Subject<void>();
        // eslint-disable-next-line no-underscore-dangle
        this.useTauriSocket = !!window.__TAURI_IPC__;

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
            tauri.tauri.invoke(RustCommand.EstablishConnection, { address: environment.serverUrl }).then(() => {
                tauri.event
                    .listen(RustEvent.SocketConnectionFailed, (event: Event<unknown>) => {
                        this.languageService.getWord('error.socket.connection_failed').subscribe((word: string) => {
                            this.snackBarService.openError((word + ' : ' + event.payload) as string);
                        });
                    })
                    .then();
            });
        } else if (!this.isSocketAlive()) {
            this.connect();
        }
    }

    disconnect() {
        if (this.useTauriSocket) {
            tauri.tauri.invoke(RustCommand.Disconnect).then(() => {
                tauri.event
                    .listen(RustEvent.SocketDisconnectionFailed, (error: Event<unknown>) => {
                        this.languageService.getWord('error.socket.disconnection_failed').subscribe((word: string) => {
                            this.snackBarService.openError((word + ' : ' + error.payload) as string);
                        });
                    })
                    .then();
            });
        } else {
            this.socket.disconnect();
        }
    }

    on<T>(eventName: string, action: (data: T) => void): void {
        if (this.useTauriSocket) {
            tauri.event
                .listen(eventName, (event: Event<unknown>) => {
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
                tauri.tauri.invoke(RustCommand.Send, { eventName: event, data: JSON.stringify(data) }).then(() => {
                    tauri.event
                        .listen(RustEvent.SocketSendFailed, (error: Event<unknown>) => {
                            this.languageService.getWord('error.socket.send_failed').subscribe((word: string) => {
                                this.snackBarService.openError((word + ' : ' + error.payload) as string);
                            });
                        })
                        .then();
                });
            } else {
                tauri.tauri.invoke(RustCommand.Send, { eventName: event }).then(() => {
                    tauri.event
                        .listen(RustEvent.SocketSendFailed, (error: Event<unknown>) => {
                            this.languageService.getWord('error.socket.send_failed').subscribe((word: string) => {
                                this.snackBarService.openError((word + ' : ' + error.payload) as string);
                            });
                        })
                        .then();
                });
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
