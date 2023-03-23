import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { RoomInformation } from '@app/interfaces/room-information';
import { AppRoutes } from '@app/models/app-routes';
import { GameStatus } from '@app/models/game-status';
import { NUMBER_OF_PLAYERS } from '@common/constants/players';
import { SocketEvents } from '@common/constants/socket-events';
import { GameCreationQuery } from '@common/interfaces/game-creation-query';
import { GameScrabbleInformation } from '@common/interfaces/game-scrabble-information';
import { RoomPlayer } from '@common/interfaces/room-player';
import { IUser } from '@common/interfaces/user';
import { SnackBarService } from '@services/snack-bar.service';
import { UserService } from '@services/user.service';
import { Subject } from 'rxjs';
import { ClientSocketService } from './communication/client-socket.service';
import { GameRoom } from '@common/interfaces/game-room';
import { PlayerType } from '@common/models/player-type';

@Injectable({
    providedIn: 'root',
})
export class GameConfigurationService {
    roomInformation: RoomInformation;
    isGameStarted: Subject<boolean>;
    isRoomJoinable: Subject<boolean>;
    errorReason: string;
    availableRooms: GameRoom[];
    gameMode: string;

    constructor(
        private snackBarService: SnackBarService,
        private userService: UserService,
        private clientSocket: ClientSocketService,
        private router: Router,
    ) {
        this.availableRooms = [];
        this.roomInformation = {
            players: [],
            roomId: '',
            timer: 0,
            isCreator: false,
            statusGame: '',
            mode: '',
            botDifficulty: undefined,
            dictionary: '',
        };
        this.clientSocket.establishConnection();
        this.isRoomJoinable = new Subject<boolean>();
        this.isGameStarted = new Subject<boolean>();
        this.configureBaseSocketFeatures();
    }

    configureBaseSocketFeatures() {
        this.clientSocket.on(SocketEvents.JoinValidGame, (allPlayers: RoomPlayer[]) => {
            this.joinValidGameEvent(allPlayers);
        });

        this.clientSocket.on(SocketEvents.RejectByOtherPlayer, (user: IUser) => {
            this.rejectByOtherPlayerEvent(user);
        });

        this.clientSocket.on(SocketEvents.GameAboutToStart, (socketIDUserRoom: string[]) => {
            this.gameAboutToStartEvent(socketIDUserRoom);
        });

        this.clientSocket.on(SocketEvents.FoundAnOpponent, (opponent: RoomPlayer) => {
            this.foundAnOpponentEvent(opponent);
        });

        this.clientSocket.on(SocketEvents.GameCreatedConfirmation, (roomId: string) => {
            this.gameCreatedConfirmationEvent(roomId);
        });

        this.clientSocket.on(SocketEvents.UpdateRoomJoinable, (gamesToJoin: GameRoom[]) => {
            this.availableRooms = gamesToJoin;
        });

        this.clientSocket.on(SocketEvents.ErrorJoining, (reason: string) => {
            if (reason) {
                this.snackBarService.openError(reason);
                this.exitRoom(false);
            }
            this.exitRoom();
        });

        this.clientSocket.on(SocketEvents.OpponentLeave, (player: IUser) => {
            this.opponentLeaveEvent(player);
        });
    }

    removeRoom(): void {
        if (this.roomInformation.players.length > 1) {
            for (let i = 1; i < this.roomInformation.players.length; i++) {
                this.rejectOpponent(this.roomInformation.players[i]);
            }
        }
        this.clientSocket.send(SocketEvents.RemoveRoom, this.roomInformation.roomId);
        this.roomInformation.roomId = '';
        this.roomInformation.players = [this.roomInformation.players[0]];
    }

    exitWaitingRoom(): void {
        this.clientSocket.send(SocketEvents.ExitWaitingRoom, {
            roomId: this.roomInformation.roomId,
            user: this.userService.user,
        } as RoomPlayer);
        this.resetRoomInformation();
    }

    rejectOpponent(player: RoomPlayer): void {
        this.clientSocket.send(SocketEvents.RejectOpponent, player);
        this.roomInformation.players = this.roomInformation.players.filter((playerElement: RoomPlayer) => {
            return playerElement.user.username !== player.user.username && playerElement.user.profilePicture.name !== player.user.profilePicture.name;
        });
        if (this.roomInformation.players.length > 1) {
            this.roomInformation.statusGame = GameStatus.SearchingOpponent;
        }
    }

    gameInitialization(gameQuery: GameCreationQuery): void {
        this.roomInformation.statusGame = GameStatus.SearchingOpponent;
        this.roomInformation.players.push({
            user: gameQuery.user,
            roomId: '',
            type: PlayerType.User,
            isCreator: true,
        });
        this.roomInformation.botDifficulty = gameQuery.botDifficulty;
        this.roomInformation.timer = gameQuery.timer;
        this.roomInformation.dictionary = gameQuery.dictionary;
        this.roomInformation.isCreator = true;
        this.roomInformation.mode = gameQuery.mode;

        this.clientSocket.send(SocketEvents.CreateGame, gameQuery);
    }

    joinRoom(room: GameRoom): void {
        this.clientSocket.send(SocketEvents.JoinGameRoom, {
            roomId: room.id,
            user: this.userService.user,
            password: room.password,
        } as RoomPlayer);

        this.roomInformation.roomId = room.id;
        this.roomInformation.players = [...room.players];
        this.roomInformation.dictionary = room.dictionary;
        this.roomInformation.timer = room.timer;
        this.roomInformation.mode = room.state;
    }

    joinSecretRoom(roomId: string): void {
        this.clientSocket.send(SocketEvents.JoinGameRoom, {
            roomId,
            user: this.userService.user,
        } as RoomPlayer);

        // TODO : Make this work
    }

    joinPage(gameMode: string): void {
        this.clientSocket.send(SocketEvents.RoomLobby);
        this.roomInformation.mode = gameMode;
    }

    beginScrabbleGame(): void {
        this.clientSocket.send(SocketEvents.StartScrabbleGame, this.roomInformation.roomId);
    }

    resetRoomInformation(): void {
        this.roomInformation.roomId = '';
        this.roomInformation.botDifficulty = undefined;
        this.roomInformation.mode = '';
        this.roomInformation.players = [];
        this.roomInformation.statusGame = '';
        this.roomInformation.isCreator = false;

        this.availableRooms = [];
    }

    exitRoom(exitByIsOwn?: boolean) {
        if (this.roomInformation.isCreator) {
            this.router.navigate([`${AppRoutes.MultiGameCreationPage}/${this.gameMode}`]).then();
            this.removeRoom();
            return;
        }

        this.router.navigate([`${AppRoutes.MultiJoinPage}/${this.gameMode}`]).then();

        if (!exitByIsOwn) return;
        this.exitWaitingRoom();
    }

    private gameCreatedConfirmationEvent(roomId: string): void {
        this.roomInformation.roomId = roomId;
    }

    private opponentLeaveEvent(player: IUser): void {
        this.roomInformation.statusGame = GameStatus.SearchingOpponent;
        this.roomInformation.players = this.roomInformation.players.filter((playerElement: RoomPlayer) => {
            return !this.arePlayersTheSame(player, playerElement.user);
        });
    }

    private foundAnOpponentEvent(opponent: RoomPlayer): void {
        if (this.roomInformation.players.length < NUMBER_OF_PLAYERS) {
            this.roomInformation.players.push(opponent);
        }

        this.roomInformation.statusGame = GameStatus.FoundOpponent;
    }

    private gameAboutToStartEvent(socketIDUserRoom: string[]): void {
        if (this.roomInformation.isCreator) {
            // TODO : Change that
            const users: IUser[] = [];
            this.roomInformation.players.forEach((player: RoomPlayer) => {
                users.push(player.user);
            });

            this.clientSocket.send(SocketEvents.CreateScrabbleGame, {
                players: users,
                roomId: this.roomInformation.roomId,
                timer: this.roomInformation.timer,
                dictionary: this.roomInformation.dictionary,
                socketId: socketIDUserRoom,
                mode: this.roomInformation.mode,
                botDifficulty: this.roomInformation.botDifficulty,
            } as GameScrabbleInformation);
        }

        this.isGameStarted.next(true);
    }

    private rejectByOtherPlayerEvent(user: IUser): void {
        this.clientSocket.send(SocketEvents.RejectByOtherPlayer, {
            roomId: this.roomInformation.roomId,
            user,
        } as RoomPlayer);
        this.resetRoomInformation();

        // TODO : Language
        this.snackBarService.openError('Rejected by other player');
        this.exitRoom(false);
    }

    private joinValidGameEvent(allPlayers: RoomPlayer[]): void {
        this.roomInformation.isCreator = false;
        this.roomInformation.statusGame = GameStatus.WaitingOpponentConfirmation;
        this.roomInformation.players = [...allPlayers];

        this.router.navigate([`${AppRoutes.MultiWaitingPage}/${this.gameMode}`]).then();
    }

    private arePlayersTheSame(player1: IUser, player2: IUser): boolean {
        return (
            player1.username === player2.username && player1.email === player2.email && player1.profilePicture.name === player2.profilePicture.name
        );
    }
}
