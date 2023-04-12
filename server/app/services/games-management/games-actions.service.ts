import { GamePlayer } from '@app/classes/player/player.class';
import { RealPlayer } from '@app/classes/player/real-player.class';
import { Word } from '@common/classes/word.class';
import { RackService } from '@app/services/rack.service';
import { SocketManager } from '@app/services/socket/socket-manager.service';
import { SocketEvents } from '@common/constants/socket-events';
import { ExchangePublicInfo } from '@common/interfaces/exchange-public-info';
import { GameInfo } from '@common/interfaces/game-state';
import { PlaceWordCommandInfo } from '@common/interfaces/place-word-command-info';
import { PlayerInformation } from '@common/interfaces/player-information';
import { Socket } from 'socket.io';
import { Service } from 'typedi';
import { ErrorType, GameValidationService } from './game-validation.service';
import { GamesHandlerService } from './games-handler.service';

const CLUE_COUNT_PER_COMMAND_CALL = 3;

@Service()
export class GamesActionsService {
    constructor(
        private socketManager: SocketManager,
        private gamesHandler: GamesHandlerService,
        private rackService: RackService,
        private gameValidationService: GameValidationService,
    ) {}

    initSocketsEvents(): void {
        this.socketManager.on(SocketEvents.PlaceWordCommand, (socket, commandInfo: PlaceWordCommandInfo) => this.placeWord(socket, commandInfo));
        this.socketManager.on(SocketEvents.Exchange, (socket, letters: string[]) => this.exchange(socket, letters));
        this.socketManager.on(SocketEvents.ReserveCommand, (socket) => this.reserveCommand(socket));
        this.socketManager.on(SocketEvents.Skip, (socket) => this.skip(socket));
        this.socketManager.on(SocketEvents.ClueCommand, (socket) => this.clueCommand(socket));
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
        const player = this.gamesHandler.getPlayer(socket.id);
        if (!player) return;

        socket.emit(SocketEvents.AllReserveLetters, player.game.letterReserve.lettersReserve);
    }

    private skip(socket: Socket) {
        const gamePlayer = this.gamesHandler.getPlayer(socket.id) as RealPlayer;
        if (!gamePlayer) return;

        gamePlayer.skipTurn();
    }

    private exchange(socket: Socket, letters: string[]) {
        const gamePlayer = this.gamesHandler.getPlayer(socket.id) as RealPlayer;
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

        this.socketManager.emitRoom(gamePlayer.player.roomId, SocketEvents.ExchangeSuccess, exchangePublicInfo);
        this.gamesHandler.updatePlayersInfo(gamePlayer.player.roomId, gamePlayer.game);
    }

    private placeWord(socket: Socket, commandInfo: PlaceWordCommandInfo) {
        commandInfo = {
            ...commandInfo,
            letters: commandInfo.letters.map((letter: string) => letter.toLowerCase()),
        };
        const gamePlayer = this.gamesHandler.getPlayer(socket.id) as RealPlayer;
        if (!gamePlayer) return;

        const game = gamePlayer.game;
        if (!game) return;

        const placement: Word | ErrorType = this.gameValidationService.verifyPlaceWordCommand(gamePlayer, commandInfo);

        if (!(placement instanceof Word)) {
            socket.emit(SocketEvents.PlacementFailure, placement);
            return;
        }

        const wordPlacementResult = game.letterPlacement.placeWord(placement, commandInfo, gamePlayer, game.gameboard);

        // Update rack
        if (wordPlacementResult.hasPassed) {
            this.rackService.updatePlayerRack(commandInfo.letters, gamePlayer.rack);
            game.giveNewLetterToRack(gamePlayer, commandInfo.letters.length, wordPlacementResult);
        }

        // Complete turn
        game.concludeGameVerification(gamePlayer);

        const playersInfo: PlayerInformation[] = this.gamesHandler.players.map((player: GamePlayer) => {
            return player.getInformation();
        });

        const viewUpdateInfo: GameInfo = {
            gameboard: wordPlacementResult.gameboard.toStringArray(),
            players: playersInfo,
            activePlayer: gamePlayer.game.turn.activePlayer,
        };

        this.socketManager.emitRoom(gamePlayer.player.roomId, SocketEvents.PublicViewUpdate, viewUpdateInfo);
        this.gamesHandler.updatePlayersInfo(gamePlayer.player.roomId, gamePlayer.game);

        if (wordPlacementResult.hasPassed) this.socketManager.emitRoom(gamePlayer.player.roomId, SocketEvents.PlacementSuccess);
        else wordPlacementResult.invalidWords.forEach((invalidWord: Word) => socket.emit(SocketEvents.PlacementFailure, invalidWord));
    }
}
