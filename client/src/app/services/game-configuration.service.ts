import { Injectable } from '@angular/core';
import { GameParameters } from '@app/classes/game-parameters';
import { GameRoomClient } from '@app/classes/game-room-client';
import { ReplaySubject } from 'rxjs';
import { ClientSocketService } from './client-socket.service';

const FOUND_OPPONENT_MESSAGE = 'Adversaire Trouvé';
const SEARCHING_OPPONENT = "En Attente d'un Adversaire ...";
const WAITING_OPPONENT_CONFIRMATION = "En Attente de la confirmation de L'adversaire";
@Injectable({
    providedIn: 'root',
})
export class GameConfigurationService {
    availableRooms: GameRoomClient[];
    statusGame: string;
    isCreator: boolean;
    playerName: string[];
    roomId: string;
    isGameStarted: ReplaySubject<boolean>;
    isRoomJoinable: ReplaySubject<boolean>;
    errorReason: ReplaySubject<string>;

    constructor(private clientSocket: ClientSocketService) {
        this.playerName = [];
        this.availableRooms = [];
        this.clientSocket.establishConnection();
        this.isRoomJoinable = new ReplaySubject<boolean>(1);
        this.isGameStarted = new ReplaySubject<boolean>(1);
        this.errorReason = new ReplaySubject<string>(1);
        this.configureBaseSocketFeatures();
    }

    configureBaseSocketFeatures() {
        this.clientSocket.on('joinValid', (playerName: string) => {
            this.isCreator = false;
            this.statusGame = WAITING_OPPONENT_CONFIRMATION;
            this.isRoomJoinable.next(true);
            this.resetRoomJoinableSubject();
            this.playerName[1] = playerName;
        });

        this.clientSocket.on('rejectByOtherPlayer', (reason: string) => {
            this.clientSocket.send('rejectByOtherPlayer', { id: this.roomId, name: this.playerName[0] });
            this.roomId = '';
            this.playerName = [];
            this.statusGame = '';
            this.errorReason.next(reason);
            this.resetErrorSubject();
        });

        this.clientSocket.on('gameAboutToStart', () => {
            this.isGameStarted.next(true);
            this.resetIsGameStartedSubject();
        });

        this.clientSocket.on('foundOpponent', (opponentName: string) => {
            this.playerName[1] = opponentName;
            this.statusGame = FOUND_OPPONENT_MESSAGE;
        });
        this.clientSocket.on('gameCreatedConfirmation', (roomId: string) => {
            this.roomId = roomId;
        });

        this.clientSocket.on('updateListOfRooms', (gamesToJoin: GameRoomClient[]) => {
            this.updateAvailableRooms(gamesToJoin);
        });

        this.clientSocket.on('joiningError', (reason: string) => {
            this.errorReason.next(reason);
            this.resetErrorSubject();
        });
    }

    resetIsGameStartedSubject() {
        this.isGameStarted = new ReplaySubject<boolean>(1);
    }
    resetRoomJoinableSubject() {
        this.isRoomJoinable = new ReplaySubject<boolean>(1);
    }
    resetErrorSubject() {
        this.errorReason = new ReplaySubject<string>(1);
    }

    removeRoom() {
        this.clientSocket.send('removeRoom', this.roomId);
        this.roomId = '';
        this.playerName.pop();
    }

    rejectOpponent() {
        this.clientSocket.send('rejectOpponent', this.roomId);
        this.statusGame = SEARCHING_OPPONENT;
        this.playerName.pop();
    }

    gameInitialization(parameters: GameParameters) {
        this.clientSocket.send('createGame', parameters);
        this.playerName[0] = parameters.username;
        this.isCreator = true;
        this.statusGame = SEARCHING_OPPONENT;
    }

    joinGame(roomId: string, username: string) {
        ///
        this.clientSocket.send('roomJoin', { id: roomId, name: username });
        this.playerName[0] = username;
        this.roomId = roomId;
    }
    joinPage() {
        //
        this.clientSocket.send('roomLobby');
    }

    beginScrabbleGame() {
        ///
        this.clientSocket.send('startScrabbleGame', this.roomId);
    }
    private updateAvailableRooms(availableRooms: GameRoomClient[]) {
        ///
        this.availableRooms = availableRooms;
    }
    // Sprint 2
    // joinRandomRoom(playerName: string) {
    //     const random = Math.floor(Math.random() * this.availableRooms.length);
    //     const roomToJoinId = this.availableRooms[random].id;
    //     this.clientSocket.send('roomJoin', { roomToJoinId, playerName });
    // }
}
