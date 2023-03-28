import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AppRoutes } from '@app/models/app-routes';
import { SocketEvents } from '@common/constants/socket-events';
import { GameRoom } from '@common/interfaces/game-room';
import { RoomPlayer } from '@common/interfaces/room-player';
import { UserRoomQuery } from '@common/interfaces/user-room-query';
import { GameDifficulty } from '@common/models/game-difficulty';
import { GameMode } from '@common/models/game-mode';
import { GameRoomState } from '@common/models/game-room-state';
import { GameVisibility } from '@common/models/game-visibility';
import { SnackBarService } from '@services/snack-bar.service';
import { UserService } from '@services/user.service';
import { window as tauriWindow } from '@tauri-apps/api';
import { TauriEvent } from '@tauri-apps/api/event';
import { Subject } from 'rxjs';
import { ClientSocketService } from './communication/client-socket.service';

@Injectable({
    providedIn: 'root',
})
export class GameConfigurationService implements OnDestroy {
    localGameRoom: GameRoom;
    // isGameStarted: Subject<boolean>;
    isRoomJoinable: Subject<boolean>;
    errorReason: string;
    availableRooms: GameRoom[];

    constructor(
        private snackBarService: SnackBarService,
        private userService: UserService,
        private clientSocket: ClientSocketService,
        private router: Router,
    ) {
        this.resetRoomInformations();
        this.availableRooms = [];

        this.isRoomJoinable = new Subject<boolean>();
        // this.isGameStarted = new Subject<boolean>();
        this.configureBaseSocketFeatures();

        // TODO : Move this somewhere more logic
        // eslint-disable-next-line no-underscore-dangle
        if (window.__TAURI_IPC__) {
            tauriWindow
                .getCurrent()
                .listen(TauriEvent.WINDOW_CLOSE_REQUESTED, () => {
                    if (this.localGameRoom) {
                        alert('Disconnecting from socket!');
                        this.clientSocket.send(SocketEvents.ExitWaitingRoom, {
                            roomId: this.localGameRoom.id,
                            user: this.userService.user,
                        } as UserRoomQuery);
                    }
                    tauriWindow.getCurrent().close().then();
                })
                .then();
        }
    }

    configureBaseSocketFeatures() {
        this.clientSocket.on(SocketEvents.JoinedValidWaitingRoom, (gameRoom: GameRoom) => {
            this.joinedValidGame(gameRoom);
        });

        this.clientSocket.on(SocketEvents.KickedFromGameRoom, () => {
            this.kickedFromGameRoom();
        });

        this.clientSocket.on(SocketEvents.GameAboutToStart, () => {
            this.router.navigate([AppRoutes.GamePage]).then();
        });

        this.clientSocket.on(SocketEvents.PlayerJoinedWaitingRoom, (opponent: RoomPlayer) => {
            this.localGameRoom.players.push(opponent);
        });

        this.clientSocket.on(SocketEvents.UpdateWaitingRoom, (room: GameRoom) => {
            this.localGameRoom = room;
        });

        this.clientSocket.on(SocketEvents.UpdateGameRooms, (gamesToJoin: GameRoom[]) => {
            this.availableRooms = gamesToJoin;
        });

        this.clientSocket.on(SocketEvents.ErrorJoining, (reason: string) => {
            if (reason) {
                this.snackBarService.openError(reason);
            }
            this.exitWaitingRoom();
        });
    }

    ngOnDestroy() {
        // if (this.localGameRoom) {
        //     this.clientSocket.send(SocketEvents.ExitWaitingRoom, {
        //         roomId: this.localGameRoom.id,
        //         user: this.userService.user,
        //     } as UserRoomQuery);
        // }
    }

    rejectOpponent(player: RoomPlayer): void {
        this.clientSocket.send(SocketEvents.ExitWaitingRoom, {
            user: player.user,
            roomId: player.roomId,
        } as UserRoomQuery);
    }

    joinRoom(room: GameRoom): void {
        this.clientSocket.send(SocketEvents.JoinWaitingRoom, {
            roomId: room.id,
            socketId: '',
            user: this.userService.user,
            password: room.password,
            isCreator: false,
        } as RoomPlayer);
    }

    joinSecretRoom(roomId: string): void {
        this.clientSocket.send(SocketEvents.JoinWaitingRoom, {
            roomId,
            socketId: '',
            user: this.userService.user,
        } as RoomPlayer);
    }

    navigateJoinPage(gameMode: GameMode): void {
        this.clientSocket.send(SocketEvents.EnterRoomLobby);
        this.localGameRoom.mode = gameMode;
    }

    beginScrabbleGame(): void {
        this.clientSocket.send(SocketEvents.StartScrabbleGame, this.localGameRoom.id);
    }

    resetRoomInformations(): void {
        this.localGameRoom = {
            id: '',
            players: [],
            dictionary: '',
            timer: -1,
            mode: GameMode.Solo,
            state: GameRoomState.Waiting,
            visibility: GameVisibility.Public,
            password: '',
            difficulty: GameDifficulty.Easy,
        };
    }

    exitWaitingRoom() {
        this.clientSocket.send(SocketEvents.ExitWaitingRoom, {
            roomId: this.localGameRoom.id,
            user: this.userService.user,
        } as RoomPlayer);

        this.resetRoomInformations();
    }

    isGameCreator(): boolean {
        return !!this.localGameRoom.players.find((player: RoomPlayer) => player.isCreator && player.user.username === this.userService.user.username);
    }

    private kickedFromGameRoom(): void {
        this.resetRoomInformations();

        this.router.navigate([`${AppRoutes.MultiJoinPage}/multi`]).then();
        // TODO : Language
        this.snackBarService.openError('Rejected by other player');
    }

    private joinedValidGame(gameRoom: GameRoom): void {
        this.localGameRoom = gameRoom;
        this.router.navigate([`${AppRoutes.MultiWaitingPage}/${gameRoom.mode}`]).then();
    }
}
