import { Injectable } from '@angular/core';
import { GameParameters } from '@app/interfaces/game-parameters';
import { GameRoomClient } from '@app/interfaces/game-room-client';
import { RoomInformation } from '@app/interfaces/room-information';
import { GameStatus } from '@app/models/game-status';
import { SocketEvents } from '@common/constants/socket-events';
import { ReplaySubject } from 'rxjs';
import { ClientSocketService } from './communication/client-socket.service';

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
        this.clientSocket.on(SocketEvents.JoinValidGame, (playerName: string) => {
            this.joinValidGameEvent(playerName);
        });

        this.clientSocket.on(SocketEvents.RejectByOtherPlayer, (name: string) => {
            this.rejectByOtherPlayerEvent(name);
        });

        this.clientSocket.on(SocketEvents.GameAboutToStart, (socketIDUserRoom: string[]) => {
            this.gameAboutToStartEvent(socketIDUserRoom);
        });

        this.clientSocket.on(SocketEvents.FoundAnOpponent, (opponentName: string) => {
            this.foundAnOpponentEvent(opponentName);
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
        if (this.roomInformation.playerName.length > 1) {
            for (let i = 1; i < this.roomInformation.playerName.length; i++) {
                this.rejectOpponent(this.roomInformation.playerName[i]);
            }
        }
        this.clientSocket.send(SocketEvents.RemoveRoom, this.roomInformation.roomId);
        this.roomInformation.roomId = '';
        this.roomInformation.playerName.pop();
    }

    exitWaitingRoom(): void {
        this.clientSocket.send(SocketEvents.ExitWaitingRoom, { id: this.roomInformation.roomId, name: this.roomInformation.playerName[0] });
        this.resetRoomInformation();
    }

    rejectOpponent(playerName: string): void {
        this.clientSocket.send(SocketEvents.RejectOpponent, { id: this.roomInformation.roomId, name: playerName });
        this.roomInformation.statusGame = GameStatus.SearchingOpponent;
        this.roomInformation.playerName.pop();
    }

    gameInitialization(parameters: GameParameters): void {
        this.roomInformation.statusGame = GameStatus.SearchingOpponent;
        if (parameters.opponent !== undefined) {
            this.roomInformation.playerName[1] = parameters.opponent;
            this.roomInformation.botDifficulty = parameters.botDifficulty;
        }
        this.clientSocket.send(SocketEvents.CreateGame, parameters);
        this.roomInformation.timer = parameters.timer;
        this.roomInformation.dictionary = parameters.dictionary;
        this.roomInformation.playerName[0] = parameters.username;
        this.roomInformation.isCreator = true;
        this.roomInformation.mode = parameters.mode;
    }

    joinGame(roomId: string, username: string): void {
        this.clientSocket.send(SocketEvents.PlayerJoinGameAvailable, { id: roomId, name: username });
        this.roomInformation.playerName[0] = username;
        this.roomInformation.roomId = roomId;
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
        this.roomInformation.playerName = [];
        this.roomInformation.statusGame = '';
        this.roomInformation.isCreator = false;
        this.availableRooms = [];
    }

    joinRandomRoom(playerName: string): void {
        const random = Math.floor(Math.random() * this.availableRooms.length);
        const roomToJoinId = this.availableRooms[random].id;
        this.roomInformation.playerName[0] = playerName;
        this.roomInformation.roomId = roomToJoinId;
        this.clientSocket.send(SocketEvents.PlayerJoinGameAvailable, { id: roomToJoinId, name: playerName });
    }

    private gameCreatedConfirmationEvent(roomId: string): void {
        this.roomInformation.roomId = roomId;
        if (this.roomInformation.playerName[1]) this.clientSocket.send(SocketEvents.StartScrabbleGame, this.roomInformation.roomId);
    }

    private opponentLeaveEvent(): void {
        this.roomInformation.statusGame = GameStatus.SearchingOpponent;
        this.roomInformation.playerName.pop();
    }

    private foundAnOpponentEvent(opponentName: string): void {
        if (this.roomInformation.playerName.length < 4) {
            this.roomInformation.playerName.push(opponentName);
        }
        this.roomInformation.statusGame = GameStatus.FoundOpponent;
    }

    private gameAboutToStartEvent(socketIDUserRoom: string[]): void {
        if (this.roomInformation.isCreator) {
            this.clientSocket.send(SocketEvents.CreateScrabbleGame, {
                playerName: this.roomInformation.playerName,
                roomId: this.roomInformation.roomId,
                timer: this.roomInformation.timer,
                dictionary: this.roomInformation.dictionary,
                socketId: socketIDUserRoom,
                mode: this.roomInformation.mode,
                botDifficulty: this.roomInformation.botDifficulty,
            });
        }
        this.setIsGameStartedSubject();
    }

    private rejectByOtherPlayerEvent(name: string): void {
        if (name !== this.roomInformation.playerName[0]) return;

        this.clientSocket.send(SocketEvents.RejectByOtherPlayer, { id: this.roomInformation.roomId, name: this.roomInformation.playerName[0] });
        this.resetRoomInformation();
        // TODO : Language
        this.setErrorSubject('Rejected by other player');
    }

    private joinValidGameEvent(playerName: string): void {
        this.roomInformation.isCreator = false;
        this.roomInformation.statusGame = GameStatus.WaitingOpponentConfirmation;
        this.roomInformation.playerName[1] = playerName;
        this.setRoomJoinableSubject();
    }

    private updateAvailableRooms(availableRooms: GameRoomClient[]): void {
        this.availableRooms = this.filterGameMode(this.roomInformation.mode, availableRooms);
    }

    private filterGameMode(gameMode: string, availableRooms: GameRoomClient[]): GameRoomClient[] {
        return availableRooms.filter((element) => {
            return element.mode === gameMode;
        });
    }
}
