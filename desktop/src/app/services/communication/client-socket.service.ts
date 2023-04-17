import { Injectable, NgZone } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DialogBoxReconnectionComponent } from '@app/components/dialog-box-reconnection/dialog-box-reconnection.component';
import { RustCommand, RustEvent } from '@app/models/rust-command';
import { LanguageService } from '@services/language.service';
import { SnackBarService } from '@services/snack-bar.service';
import { TauriStateService } from '@services/tauri-state.service';
import * as tauri from '@tauri-apps/api';
import { Event, listen, TauriEvent, UnlistenFn } from '@tauri-apps/api/event';
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
    reconnect: Subject<void>;
    cancelConnection: Subject<void>;
    reconnectionDialog: MatDialogRef<DialogBoxReconnectionComponent>;
    private socket: Socket;
    private subscriptions: Map<string, Promise<any>>;

    constructor(
        private snackBarService: SnackBarService,
        private languageService: LanguageService,
        private tauriStateService: TauriStateService, // private dialog: MatDialog,
        private dialog: MatDialog,
        private ngZone: NgZone,
    ) {
        this.subscriptions = new Map();
        this.appUpdate = new Subject();
        this.connected = new BehaviorSubject<boolean>(false);
        this.reconnect = new Subject();
        this.cancelConnection = new Subject();

        tauri.event
            .listen(TauriEvent.WINDOW_CLOSE_REQUESTED, (event: any) => {
                if (event.windowLabel === 'main') {
                    tauri.window.getAll().forEach((window: WebviewWindow) => {
                        window.close().then();
                    });
                } else if (event.windowLabel === 'chat') {
                    console.log('chat window closed');
                }
            })
            .then();
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
                this.ngZone.run(() => {
                    this.languageService.getWord('error.socket.connection_failed').subscribe((word: string) => {
                        this.snackBarService.openError(('Connection error! ' + word + ' : ' + event.payload) as string);
                    });
                });
            })
            .then();
    }

    async disconnect() {
        if (this.tauriStateService.useTauri) {
            await tauri.tauri.invoke(RustCommand.Disconnect).then(() => {
                tauri.event
                    .listen(RustEvent.SocketDisconnectionFailed, (error: Event<unknown>) => {
                        this.ngZone.run(() => {
                            this.languageService.getWord('error.socket.disconnection_failed').subscribe((word: string) => {
                                this.snackBarService.openError(('Disconnection error! ' + word + ' : ' + error.payload) as string);
                            });
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
        const unlisten = listen<T>(eventName, (event: Event<unknown>) => {
            this.ngZone.run(() => {
                action(JSON.parse(event.payload as string));
            });
        });

        this.subscriptions.set(eventName, unlisten);
    }

    off(eventName: string): void {
        this.subscriptions.get(eventName).then((unlisten: UnlistenFn) => {
            unlisten();
        });
    }

    send<T>(event: string, data?: T): void {
        if (!this.connected.value && tauri.window.appWindow.label !== 'chat') return;

        if (this.tauriStateService.useTauri) {
            if (data) {
                tauri.tauri.invoke(RustCommand.Send, { eventName: event, data: JSON.stringify(data) }).then(() => {
                    tauri.event
                        .listen(RustEvent.SocketSendFailed, () => {
                            this.ngZone.run(() => {
                                if (this.connected.value) {
                                    this.launchReconnectionProtocol();
                                }
                            });
                        })
                        .then();
                });
            } else {
                tauri.tauri.invoke(RustCommand.Send, { eventName: event }).then(() => {
                    tauri.event
                        .listen(RustEvent.SocketSendFailed, () => {
                            this.ngZone.run(() => {
                                if (this.connected.value) {
                                    this.launchReconnectionProtocol();
                                }
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

    launchReconnectionProtocol(): void {
        this.languageService.getWord('error.socket.send_failed').subscribe(() => {
            // this.snackBarService.openError((word + ' : ' + error.payload) as string);

            if (this.reconnectionDialog) return;

            // TODO : Propose a reconnection attempt
            this.reconnectionDialog = this.dialog.open(DialogBoxReconnectionComponent, {
                disableClose: true,
            });
            this.reconnectionDialog.afterClosed().subscribe((toReconnect: boolean) => {
                if (toReconnect) {
                    this.reconnect.next();
                    return;
                }
                this.cancelConnection.next();
            });
        });
    }
}
