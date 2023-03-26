import { Player } from '@app/classes/player/player.class';
import { RealPlayer } from '@app/classes/player/real-player.class';
import { Word } from '@app/classes/word.class';
import { RackService } from '@app/services/rack.service';
import { SocketManager } from '@app/services/socket/socket-manager.service';
import { SocketEvents } from '@common/constants/socket-events';
import { ExchangePublicInfo, PlaceWordCommandInfo, ViewUpdateInfo } from '@common/interfaces/game-actions';
import { Socket } from 'socket.io';
import { Service } from 'typedi';
import { GamesHandler } from './games-handler.service';

const CLUE_COUNT_PER_COMMAND_CALL = 3;

@Service()
export class GamesActionsService {
    constructor(private socketManager: SocketManager, private gamesHandler: GamesHandler, private rackService: RackService) {}
    initSocketsEvents(): void {
        this.socketManager.on(SocketEvents.PlaceWordCommand, this.playGame);
        this.socketManager.on(SocketEvents.Exchange, this.exchange);
        this.socketManager.on(SocketEvents.ReserveCommand, this.reserveCommand);
        this.socketManager.on(SocketEvents.Skip, this.skip);
        this.socketManager.on(SocketEvents.ClueCommand, this.clueCommand);
    }

    private clueCommand(this: this, socket: Socket) {
        const letterString: string[] = [];
        const player = this.gamesHandler.players.get(socket.id) as Player;

        player.clueCommandUseCount++;
        player.game.wordSolver.setGameboard(player.game.gameboard);
        player.rack.forEach((letter) => letterString.push(letter.value));

        const wordToChoose: PlaceWordCommandInfo[] = this.reduceClueOptions(player.game.wordSolver.findAllOptions(letterString));
        socket.emit(SocketEvents.ClueCommand, wordToChoose);
    }

    private reduceClueOptions(commandInfoList: PlaceWordCommandInfo[]): PlaceWordCommandInfo[] {
        const wordToChoose: PlaceWordCommandInfo[] = [];

        for (let i = 0; i < CLUE_COUNT_PER_COMMAND_CALL; i++) {
            if (commandInfoList.length === 0) break;
            const random = Math.floor(Math.random() * commandInfoList.length);
            wordToChoose.push(commandInfoList[random]);
            commandInfoList.splice(random, 1);
        }

        return wordToChoose;
    }

    private reserveCommand(this: this, socket: Socket) {
        if (!this.gamesHandler.players.has(socket.id)) return;

        const player: Player = this.gamesHandler.players.get(socket.id) as Player;
        socket.emit(SocketEvents.AllReserveLetters, player.game.letterReserve.lettersReserve);
    }

    private skip(this: this, socket: Socket) {
        if (!this.gamesHandler.players.has(socket.id)) return;

        const player = this.gamesHandler.players.get(socket.id) as RealPlayer;
        player.skipTurn();
    }

    private exchange(this: this, socket: Socket, letters: string[]) {
        if (!this.gamesHandler.players.has(socket.id)) return;

        const lettersToExchange = letters.length;
        const player = this.gamesHandler.players.get(socket.id) as RealPlayer;

        if (!this.rackService.areLettersInRack(letters, player)) {
            socket.emit(SocketEvents.ExchangeFailure);
            return;
        }

        player.exchangeLetter(letters);
        const exchangePublicInfo: ExchangePublicInfo = {
            letterAmount: lettersToExchange,
            player: player.name,
        };
        socket.broadcast.to(player.room).emit(SocketEvents.ExchangeSuccess, exchangePublicInfo);

        this.gamesHandler.updatePlayerInfo(player.room, player.game);
        this.socketManager.emitRoom(player.room, SocketEvents.PlaceWordCommand, player.getInformation(), player.game.turn.activePlayer);
    }

    private playGame(this: this, socket: Socket, commandInfo: PlaceWordCommandInfo) {
        if (!this.gamesHandler.players.has(socket.id)) return;

        const player = this.gamesHandler.players.get(socket.id) as RealPlayer;
        const placementResult = player.placeLetter(commandInfo);

        if (typeof placementResult === 'string') {
            socket.emit(SocketEvents.PlacementFailure, placementResult);
            return;
        }

        const viewUpdateInfo: ViewUpdateInfo = {
            gameboard: placementResult.gameboard.toStringArray(),
            activePlayer: player.game.turn.activePlayer,
        };
        this.socketManager.emitRoom(player.room, SocketEvents.PublicViewUpdate, viewUpdateInfo);

        this.gamesHandler.updatePlayerInfo(player.room, player.game);

        if (placementResult.hasPassed) socket.broadcast.to(player.room).emit(SocketEvents.PlacementSuccess);
        else placementResult.invalidWords.forEach((invalidWord: Word) => socket.emit(SocketEvents.PlacementFailure, invalidWord));
    }
}
