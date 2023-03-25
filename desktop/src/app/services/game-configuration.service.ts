import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AppRoutes } from '@app/models/app-routes';
import { NUMBER_OF_PLAYERS } from '@common/constants/players';
import { SocketEvents } from '@common/constants/socket-events';
import { GameScrabbleInformation } from '@common/interfaces/game-scrabble-information';
import { RoomPlayer } from '@common/interfaces/room-player';
import { IUser } from '@common/interfaces/user';
import { SnackBarService } from '@services/snack-bar.service';
import { UserService } from '@services/user.service';
import { Subject } from 'rxjs';
import { ClientSocketService } from './communication/client-socket.service';
import { GameRoom } from '@common/interfaces/game-room';
import { GameRoomState } from '@common/models/game-room-state';
import { GameMode } from '@common/models/game-mode';
import { GameVisibility } from '@common/models/game-visibility';
import { UserRoomQuery } from '@common/interfaces/user-room-query';
import { window as tauriWindow } from '@tauri-apps/api';
import { TauriEvent } from '@tauri-apps/api/event';

@Injectable({
    providedIn: 'root',
})
export class GameConfigurationService implements OnDestroy {
    localGameRoom: GameRoom;
    isGameStarted: Subject<boolean>;
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
        this.isGameStarted = new Subject<boolean>();
        this.configureBaseSocketFeatures();

        // TODO : Move this somewhere more logic
        // eslint-disable-next-line no-underscore-dangle
        if (window.__TAURI_IPC__) {
            tauriWindow
                .getCurrent()
                .listen(TauriEvent.WINDOW_CLOSE_REQUESTED, () => {
                    if (this.localGameRoom) {
                        alert('disconnecting from socket!');
                        this.clientSocket.send(SocketEvents.ExitWaitingRoom, {
                            roomId: this.localGameRoom.id,
                            user: this.userService.user,
                        } as UserRoomQuery);
                    }
                    alert('test');
                    tauriWindow.getCurrent().close().then();
                })
                .then();
        }
    }

    configureBaseSocketFeatures() {
        this.clientSocket.on(SocketEvents.JoinedValidGame, (gameRoom: GameRoom) => {
            this.joinedValidGame(gameRoom);
        });

        this.clientSocket.on(SocketEvents.KickedFromGameRoom, () => {
            this.kickedFromGameRoom();
        });

        this.clientSocket.on(SocketEvents.GameAboutToStart, (players: RoomPlayer[]) => {
            this.gameAboutToStartEvent(players);
        });

        this.clientSocket.on(SocketEvents.FoundAnOpponent, (opponent: RoomPlayer) => {
            this.foundAnOpponentEvent(opponent);
        });

        this.clientSocket.on(SocketEvents.CurrentGameRoomUpdate, (room: GameRoom) => {
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

        this.clientSocket.on(SocketEvents.OpponentLeave, (player: IUser) => {
            this.opponentLeaveEvent(player);
        });
    }

    ngOnDestroy() {
        if (this.localGameRoom) {
            this.clientSocket.send(SocketEvents.ExitWaitingRoom, {
                roomId: this.localGameRoom.id,
                user: this.userService.user,
            } as UserRoomQuery);
        }
    }

    rejectOpponent(player: RoomPlayer): void {
        this.clientSocket.send(SocketEvents.ExitWaitingRoom, {
            user: player.user,
            roomId: player.roomId,
        } as UserRoomQuery);
    }

    joinRoom(room: GameRoom): void {
        this.clientSocket.send(SocketEvents.JoinGameRoom, {
            roomId: room.id,
            socketId: '',
            user: this.userService.user,
            password: room.password,
        } as RoomPlayer);

        this.localGameRoom = room;
    }

    joinSecretRoom(roomId: string): void {
        this.clientSocket.send(SocketEvents.JoinGameRoom, {
            roomId,
            socketId: '',
            user: this.userService.user,
        } as RoomPlayer);

        // TODO : Make this work
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

    private opponentLeaveEvent(player: IUser): void {
        this.localGameRoom.players = this.localGameRoom.players.filter((playerElement: RoomPlayer) => {
            return !this.arePlayersTheSame(player, playerElement.user);
        });
    }

    private foundAnOpponentEvent(opponent: RoomPlayer): void {
        if (this.localGameRoom.players.length < NUMBER_OF_PLAYERS) {
            this.localGameRoom.players.push(opponent);
        }
    }

    private gameAboutToStartEvent(players: RoomPlayer[]): void {
        if (this.isGameCreator()) {
            // TODO : Change that
            const users: IUser[] = [];
            players.forEach((player: RoomPlayer) => {
                users.push(player.user);
            });

            this.clientSocket.send(SocketEvents.CreateScrabbleGame, {
                players: users,
                roomId: this.localGameRoom.id,
                timer: this.localGameRoom.timer,
                dictionary: this.localGameRoom.dictionary,
                socketId: [],
                mode: this.localGameRoom.mode,
            } as GameScrabbleInformation);
        }

        this.isGameStarted.next(true);
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

    private arePlayersTheSame(player1: IUser, player2: IUser): boolean {
        return (
            player1.username === player2.username && player1.email === player2.email && player1.profilePicture.name === player2.profilePicture.name
        );
    }
}
