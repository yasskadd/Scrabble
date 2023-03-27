import { Injectable } from '@angular/core';
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
export class ClientSocketService {
    updateSubject: Subject<void>;
    private socket: Socket;
    private connected: boolean;

    private readonly useTauriSocket: boolean;

    constructor(private snackBarService: SnackBarService, private languageService: LanguageService) {
        this.updateSubject = new Subject<void>();

        // eslint-disable-next-line no-underscore-dangle
        this.useTauriSocket = !!window.__TAURI_IPC__;
    }

    isSocketAlive() {
        return this.socket && this.socket.connected;
    }

    connect(cookie?: string) {
        if (cookie) {
            this.socket = io(environment.serverUrl, {
                transports: ['websocket'],
                upgrade: false,
                /* eslint-disable-next-line @typescript-eslint/naming-convention*/
                extraHeaders: { Cookie: `session_token=${cookie}` },
            });
        } else {
            this.socket = io(environment.serverUrl, { transports: ['websocket'], upgrade: false });
        }

        this.connected = true;
    }

    establishConnection(cookie?: string) {
        if (this.connected) {
            this.disconnect();
        }
        if (this.useTauriSocket) {
            if (cookie) {
                tauri.tauri
                    .invoke(RustCommand.EstablishConnection, { address: environment.serverUrl, cookie: `session_token=${cookie}` })
                    .then(() => {
                        this.listenToTauriEvents();
                    });
            } else {
                tauri.tauri.invoke(RustCommand.EstablishConnection, { address: environment.serverUrl }).then(() => {
                    this.listenToTauriEvents();
                });
            }
        } else if (!this.isSocketAlive()) {
            if (cookie) {
                this.connect(cookie);
            } else {
                this.connect();
            }
        }
    }

    listenToTauriEvents(): void {
        tauri.event
            .listen(RustEvent.SocketConnectionFailed, (event: Event<unknown>) => {
                this.languageService.getWord('error.socket.connection_failed').subscribe((word: string) => {
                    this.snackBarService.openError((word + ' : ' + event.payload) as string);
                });
            })
            .then();
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

        this.connected = false;
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
