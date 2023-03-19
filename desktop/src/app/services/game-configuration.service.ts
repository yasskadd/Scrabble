import { Injectable } from '@angular/core';
import { GameParameters } from '@app/interfaces/game-parameters';
import { GameRoomClient } from '@app/interfaces/game-room-client';
import { RoomInformation } from '@app/interfaces/room-information';
import { GameStatus } from '@app/models/game-status';
import { SocketEvents } from '@common/constants/socket-events';
import { ReplaySubject } from 'rxjs';
import { ClientSocketService } from './communication/client-socket.service';
import { IUser } from '@common/interfaces/user';
import { UserService } from '@services/user.service';
import { PlayerRoomInfo } from '@common/interfaces/player-room-info';
import { GameScrabbleInformation } from '@common/interfaces/game-scrabble-information';
import { HttpHandlerService } from '@services/communication/http-handler.service';
import { SnackBarService } from '@services/snack-bar.service';
import { AppRoutes } from '@app/models/app-routes';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root',
})
export class GameConfigurationService {
    roomInformation: RoomInformation;
    availableRooms: GameRoomClient[];
    isGameStarted: ReplaySubject<boolean>;
    isRoomJoinable: ReplaySubject<boolean>;
    errorReason: ReplaySubject<string>;

    constructor(private clientSocket: ClientSocketService) {
        this.availableRooms = [];
        this.roomInformation = {
            playerName: [],
            roomId: '',
            timer: 0,
            isCreator: false,
            statusGame: '',
            mode: '',
            botDifficulty: undefined,
            dictionary: '',
        };
        this.clientSocket.establishConnection();
        this.isRoomJoinable = new ReplaySubject<boolean>(1);
        this.isGameStarted = new ReplaySubject<boolean>(1);
        this.errorReason = new ReplaySubject<string>(1);
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
            this.updateAvailableRooms(gamesToJoin);
        });

        this.clientSocket.on(SocketEvents.ErrorJoining, (reason: string) => {
            this.setErrorSubject(reason);
        });

        this.clientSocket.on(SocketEvents.OpponentLeave, () => {
            this.opponentLeaveEvent();
        });
    }

    setIsGameStartedSubject(): void {
        this.isGameStarted.next(true);
        this.isGameStarted = new ReplaySubject<boolean>(1);
    }

    setRoomJoinableSubject(): void {
        this.isRoomJoinable.next(true);
        this.isRoomJoinable = new ReplaySubject<boolean>(1);
    }

    setErrorSubject(reason: string): void {
        this.errorReason.next(reason);
        this.errorReason = new ReplaySubject<string>(1);
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
    }

    joinRandomRoom(playerName: string): void {
        const random = Math.floor(Math.random() * this.availableRooms.length);
        const roomToJoinId = this.availableRooms[random].id;
        this.roomInformation.players = [this.userService.user];
        this.roomInformation.roomId = roomToJoinId;
        this.clientSocket.send(SocketEvents.PlayerJoinGameAvailable, {
            roomId: roomToJoinId,
            player: this.roomInformation.players[0],
        } as PlayerRoomInfo);
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
        if (this.roomInformation.players.length < 4) {
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
        this.setIsGameStartedSubject();
    }

    private rejectByOtherPlayerEvent(name: string): void {
        if (name !== this.roomInformation.players[0].username) return;

        this.clientSocket.send(SocketEvents.RejectByOtherPlayer, {
            roomId: this.roomInformation.roomId,
            player: this.roomInformation.players[0],
        } as PlayerRoomInfo);
        this.resetRoomInformation();

        // TODO : Language
        this.setErrorSubject('Rejected by other player');
    }

    private joinValidGameEvent(allPlayers: IUser[]): void {
        this.roomInformation.isCreator = false;
        this.roomInformation.statusGame = GameStatus.WaitingOpponentConfirmation;
        this.roomInformation.players = [...allPlayers];

    private updateAvailableRooms(availableRooms: GameRoomClient[]): void {
        this.availableRooms = this.filterGameMode(this.roomInformation.mode, availableRooms);
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

    private exitRoom(exitByIsOwn?: boolean) {
        if (this.roomInformation.isCreator) {
            this.router.navigate([`${AppRoutes.MultiGameCreationPage}/${this.gameMode}`]).then();
            this.removeRoom();
            return;
        }

        this.router.navigate([`${AppRoutes.MultiJoinPage}/${this.gameMode}`]).then();

        if (!exitByIsOwn) return;
        this.exitWaitingRoom();
    }
}
