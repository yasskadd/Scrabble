import { GamePlayer } from '@app/classes/player/player.class';
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

    private clueCommand(socket: Socket) {
        const letterString: string[] = [];
        const player = this.gamesHandler.players.find((gamePlayer: GamePlayer) => gamePlayer.player.socketId === socket.id);
        if (!player) return;

        player.clueCommandUseCount++;
        player.game.wordSolver.setGameboard(player.game.gameboard);
        player.rack.forEach((letter) => {
            letterString.push(letter.value);
        });
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

    private reserveCommand(socket: Socket) {
        const player = this.gamesHandler.getPlayerFromSocketId(socket.id);
        if (!player) return;

        socket.emit(SocketEvents.AllReserveLetters, player.game.letterReserve.lettersReserve);
    }

    private skip(socket: Socket) {
        const gamePlayer = this.gamesHandler.getPlayerFromSocketId(socket.id) as RealPlayer;
        if (!gamePlayer) return;

        gamePlayer.skipTurn();
    }

    private exchange(socket: Socket, letters: string[]) {
        const gamePlayer = this.gamesHandler.getPlayerFromSocketId(socket.id) as RealPlayer;
        if (!gamePlayer) return;

        const lettersToExchange = letters.length;

        if (!this.rackService.areLettersInRack(letters, gamePlayer)) {
            socket.emit(SocketEvents.ExchangeFailure);
            return;
        }
        gamePlayer.exchangeLetter(letters);
        const exchangePublicInfo: ExchangePublicInfo = {
            letterAmount: lettersToExchange,
            player: gamePlayer.player.user.username,
        };

        socket.broadcast.to(gamePlayer.player.roomId).emit(SocketEvents.ExchangeSuccess, exchangePublicInfo);
        this.gamesHandler.updatePlayersInfo(gamePlayer.player.roomId, gamePlayer.game);
        // this.socketManager.emitRoom(gamePlayer.player.roomId, SocketEvents.Play, gamePlayer.getInformation(), gamePlayer.game.turn.activePlayer);
    }

    private playGame(socket: Socket, commandInfo: PlaceWordCommandInfo) {
        const gamePlayer = this.gamesHandler.getPlayerFromSocketId(socket.id) as RealPlayer;
        if (!gamePlayer) return;

        const placementResult = gamePlayer.placeLetter(commandInfo);

        if (typeof placementResult === 'string') {
            socket.emit(SocketEvents.PlacementFailure, placementResult);
            return;
        }

        const viewUpdateInfo: ViewUpdateInfo = {
            gameboard: placementResult.gameboard.toStringArray(),
            activePlayer: gamePlayer.game.turn.activePlayer,
        };
        this.socketManager.emitRoom(gamePlayer.player.roomId, SocketEvents.PublicViewUpdate, viewUpdateInfo);
        this.gamesHandler.updatePlayersInfo(gamePlayer.player.roomId, gamePlayer.game);

        if (placementResult.hasPassed) socket.broadcast.to(gamePlayer.player.roomId).emit(SocketEvents.PlacementSuccess);
        else placementResult.invalidWords.forEach((invalidWord: Word) => socket.emit(SocketEvents.PlacementFailure, invalidWord));
    }
}
