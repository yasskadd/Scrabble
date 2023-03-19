import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { GameParameters } from '@app/interfaces/game-parameters';
import { GameRoomClient } from '@app/interfaces/game-room-client';
import { RoomInformation } from '@app/interfaces/room-information';
import { AppRoutes } from '@app/models/app-routes';
import { GameStatus } from '@app/models/game-status';
import { NUMBER_OF_PLAYERS } from '@common/constants/players';
import { SocketEvents } from '@common/constants/socket-events';
import { GameScrabbleInformation } from '@common/interfaces/game-scrabble-information';
import { PlayerRoomInfo } from '@common/interfaces/player-room-info';
import { IUser } from '@common/interfaces/user';
import { HttpHandlerService } from '@services/communication/http-handler.service';
import { SnackBarService } from '@services/snack-bar.service';
import { UserService } from '@services/user.service';
import { Subject } from 'rxjs';
import { ClientSocketService } from './communication/client-socket.service';

@Injectable({
    providedIn: 'root',
})
export class GameConfigurationService {
    roomInformation: RoomInformation;
    isGameStarted: Subject<boolean>;
    isRoomJoinable: Subject<boolean>;
    errorReason: string;
    availableRooms: GameRoomClient[];
    gameMode: string;

    constructor(
        private snackBarService: SnackBarService,
        private userService: UserService,
        private clientSocket: ClientSocketService,
        private httpHandlerService: HttpHandlerService,
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
        this.clientSocket.on(SocketEvents.JoinValidGame, (allPlayers: IUser[]) => {
            this.joinValidGameEvent(allPlayers);
        });

        this.clientSocket.on(SocketEvents.RejectByOtherPlayer, (name: string) => {
            this.rejectByOtherPlayerEvent(name);
        });

        this.clientSocket.on(SocketEvents.GameAboutToStart, (socketIDUserRoom: string[]) => {
            this.gameAboutToStartEvent(socketIDUserRoom);
        });

        this.clientSocket.on(SocketEvents.FoundAnOpponent, (opponent: IUser) => {
            this.foundAnOpponentEvent(opponent);
        });

        this.clientSocket.on(SocketEvents.GameCreatedConfirmation, (roomId: string) => {
            this.gameCreatedConfirmationEvent(roomId);
        });

        this.clientSocket.on(SocketEvents.UpdateRoomJoinable, (gamesToJoin: GameRoomClient[]) => {
            this.availableRooms = this.filterGameMode(this.roomInformation.mode, gamesToJoin);
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
            player: this.roomInformation.players[0],
        } as PlayerRoomInfo);
        this.resetRoomInformation();
    }

    rejectOpponent(player: IUser): void {
        this.clientSocket.send(SocketEvents.RejectOpponent, { id: this.roomInformation.roomId, player });
        this.roomInformation.players = this.roomInformation.players.filter((playerElement: IUser) => {
            return playerElement.username !== player.username && playerElement.profilePicture.name !== player.profilePicture.name;
        });
        if (this.roomInformation.players.length > 1) {
            this.roomInformation.statusGame = GameStatus.SearchingOpponent;
        }
    }

    gameInitialization(parameters: GameParameters): void {
        this.roomInformation.statusGame = GameStatus.SearchingOpponent;
        if (parameters.opponents && parameters.opponents.length !== 0) {
            parameters.opponents.forEach((opponent: IUser) => {
                this.roomInformation.players.push(opponent);
            });
            this.roomInformation.botDifficulty = parameters.botDifficulty;
        }
        this.clientSocket.send(SocketEvents.CreateGame, parameters);
        this.roomInformation.timer = parameters.timer;
        this.roomInformation.dictionary = parameters.dictionary;
        this.roomInformation.players.push(parameters.user);
        this.roomInformation.isCreator = true;
        this.roomInformation.mode = parameters.mode;
    }

    joinGame(room: GameRoomClient, player: IUser): void {
        this.clientSocket.send(SocketEvents.PlayerJoinGameAvailable, {
            roomId: room.id,
            player,
        } as PlayerRoomInfo);

        this.roomInformation.roomId = room.id;
        this.roomInformation.players = [...room.users];
        this.roomInformation.dictionary = room.dictionary;
        this.roomInformation.timer = room.timer;
        this.roomInformation.mode = room.mode;
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
        this.updateAvailableRooms();
    }

    updateAvailableRooms(): void {
        this.httpHandlerService.getAvailableRooms().subscribe((rooms: GameRoomClient[]) => {
            this.availableRooms = this.filterGameMode(this.roomInformation.mode, rooms);
        });
    }

    joinRandomRoom(): void {
        const random = Math.floor(Math.random() * this.availableRooms.length);
        const roomToJoinId = this.availableRooms[random].id;
        this.roomInformation.players = [this.userService.user];
        this.roomInformation.roomId = roomToJoinId;
        this.clientSocket.send(SocketEvents.PlayerJoinGameAvailable, {
            roomId: roomToJoinId,
            player: this.roomInformation.players[0],
        } as PlayerRoomInfo);
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
        // if (this.roomInformation.playerName[1]) this.clientSocket.send(SocketEvents.StartScrabbleGame, this.roomInformation.roomId);
    }

    private opponentLeaveEvent(player: IUser): void {
        this.roomInformation.statusGame = GameStatus.SearchingOpponent;
        this.roomInformation.players = this.roomInformation.players.filter((playerElement: IUser) => {
            return !this.arePlayersTheSame(player, playerElement);
        });
    }

    private foundAnOpponentEvent(opponent: IUser): void {
        if (this.roomInformation.players.length < NUMBER_OF_PLAYERS) {
            this.roomInformation.players.push(opponent);
        }
        this.roomInformation.statusGame = GameStatus.FoundOpponent;
    }

    private gameAboutToStartEvent(socketIDUserRoom: string[]): void {
        if (this.roomInformation.isCreator) {
            this.clientSocket.send(SocketEvents.CreateScrabbleGame, {
                players: this.roomInformation.players,
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

    private rejectByOtherPlayerEvent(name: string): void {
        if (name !== this.roomInformation.players[0].username) return;

        this.clientSocket.send(SocketEvents.RejectByOtherPlayer, {
            roomId: this.roomInformation.roomId,
            player: this.roomInformation.players[0],
        } as PlayerRoomInfo);
        this.resetRoomInformation();

        // TODO : Language
        this.snackBarService.openError('Rejected by other player');
        this.exitRoom(false);
    }

    private joinValidGameEvent(allPlayers: IUser[]): void {
        this.roomInformation.isCreator = false;
        this.roomInformation.statusGame = GameStatus.WaitingOpponentConfirmation;
        this.roomInformation.players = [...allPlayers];

        this.router.navigate([`${AppRoutes.MultiWaitingPage}/${this.gameMode}`]).then();
    }

    private filterGameMode(gameMode: string, availableRooms: GameRoomClient[]): GameRoomClient[] {
        return availableRooms.filter((element) => {
            return element.mode === gameMode;
        });
    }

    private arePlayersTheSame(player1: IUser, player2: IUser): boolean {
        return (
            player1.username === player2.username && player1.email === player2.email && player1.profilePicture.name === player2.profilePicture.name
        );
    }
}
