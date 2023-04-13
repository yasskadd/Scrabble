import { Injectable } from '@angular/core';
import { RustCommand, RustEvent } from '@app/models/rust-command';
import { LanguageService } from '@services/language.service';
import { SnackBarService } from '@services/snack-bar.service';
import { TauriStateService } from '@services/tauri-state.service';
import * as tauri from '@tauri-apps/api';
import { Event, TauriEvent } from '@tauri-apps/api/event';
import { BehaviorSubject, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';
import { WebviewWindow } from '@tauri-apps/api/window';

@Injectable({
    providedIn: 'root',
})
export class ClientSocketService {
    appUpdate: Subject<void>;
    connected: BehaviorSubject<boolean>;
    cancelConnection: Subject<void>;

    private socket: Socket;

    constructor(
        private snackBarService: SnackBarService,
        private languageService: LanguageService,
        private tauriStateService: TauriStateService, // private dialog: MatDialog,
    ) {
        this.appUpdate = new Subject();
        this.connected = new BehaviorSubject<boolean>(false);
        this.cancelConnection = new Subject();

        if (this.tauriStateService.useTauri) {
            const appWindow = WebviewWindow.getByLabel('main');
            appWindow
                .listen(TauriEvent.WINDOW_CLOSE_REQUESTED, async () => {
                    await this.disconnect();
                    await appWindow.close();
                })
                .then();
        }
    }

    async isSocketAlive() {
        if (this.tauriStateService.useTauri) {
            const res = await tauri.tauri.invoke(RustCommand.IsSocketAlive);
            return res === RustEvent.SocketAlive ? true : res === RustEvent.SocketNotAlive ? false : false;
        } else {
            return this.socket && this.socket.connected;
        }
    }

    connect(cookie: string) {
        this.socket = io(environment.socketUrl, {
            transports: ['websocket'],
            upgrade: false,
            /* eslint-disable-next-line @typescript-eslint/naming-convention*/
            extraHeaders: { Cookie: `session_token=${cookie}` },
        });
    }

    async connectTauri(cookie: string): Promise<void> {
        return await tauri.tauri
            .invoke(RustCommand.EstablishConnection, {
                address: environment.socketUrl,
                cookie: `session_token=${cookie}`,
            })
            .then(() => {
                this.listenToTauriEvents();
            });
    }

    async establishConnection(cookie: string): Promise<void> {
        if (await this.isSocketAlive()) {
            await this.disconnect();
        }

        if (this.tauriStateService.useTauri) {
            return await this.connectTauri(cookie).then(() => {
                this.connected.next(true);
            });
        } else {
            this.connect(cookie);
            this.connected.next(true);
        }
    }

    listenToTauriEvents(): void {
        tauri.event
            .listen(RustEvent.SocketConnectionFailed, (event: Event<unknown>) => {
                this.languageService.getWord('error.socket.connection_failed').subscribe((word: string) => {
                    this.snackBarService.openError(('Connection error! ' + word + ' : ' + event.payload) as string);
                });
            })
            .then();
    }

    async disconnect() {
        if (this.tauriStateService.useTauri) {
            await tauri.tauri.invoke(RustCommand.Disconnect).then(() => {
                tauri.event
                    .listen(RustEvent.SocketDisconnectionFailed, (error: Event<unknown>) => {
                        this.languageService.getWord('error.socket.disconnection_failed').subscribe((word: string) => {
                            this.snackBarService.openError(('Disconnection error! ' + word + ' : ' + error.payload) as string);
                        });
                    })
                    .then();
            });
        } else {
            this.socket.disconnect();
        }

        this.connected.next(false);
    }

    on<T>(eventName: string, action: (data: T) => void): void {
        if (this.tauriStateService.useTauri) {
            console.log('listening to ' + eventName);
            tauri.event
                .listen(eventName, (event: Event<unknown>) => {
                    action(JSON.parse(event.payload as string));
                    this.appUpdate.next();
                })
                .then();
        } else {
            this.socket.on(eventName, action);
        }
    }

    send<T>(event: string, data?: T): void {
        if (!this.connected.value) return;

        if (this.tauriStateService.useTauri) {
            if (data) {
                tauri.tauri.invoke(RustCommand.Send, { eventName: event, data: JSON.stringify(data) }).then(() => {
                    tauri.event
                        .listen(RustEvent.SocketSendFailed, (error: Event<unknown>) => {
                            this.languageService.getWord('error.socket.send_failed').subscribe((word: string) => {
                                this.snackBarService.openError((word + ' : ' + error.payload) as string);
                                // TODO : Propose a reconnection attempt
                                // this.dialog.open();
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
