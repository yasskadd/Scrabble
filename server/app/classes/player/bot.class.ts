import { Game } from '@app/classes/game.class';
import { WordSolver } from '@app/classes/word-solver.class';
import { Word } from '@app/classes/word.class';
import * as Constant from '@app/constants/bot';
import { BotInformation } from '@app/interfaces/bot-information';
import { GameValidationService } from '@app/services/games-management/game-validation.service';
import { GamesHandlerService } from '@app/services/games-management/games-handler.service';
import { RackService } from '@app/services/rack.service';
import { SocketManager } from '@app/services/socket/socket-manager.service';
import { SocketEvents } from '@common/constants/socket-events';
import { GameInfo } from '@common/interfaces/game-state';
import { PlaceWordCommandInfo } from '@common/interfaces/place-word-command-info';
import { PlayerInformation } from '@common/interfaces/player-information';
import { RoomPlayer } from '@common/interfaces/room-player';
import { Container } from 'typedi';
import { GamePlayer } from './player.class';
import { RealPlayer } from './real-player.class';

export class Bot extends GamePlayer {
    protected countUp: number = 0;
    protected socketManager: SocketManager = Container.get(SocketManager);
    protected gameValidationService = Container.get(GameValidationService);
    protected gamesHandler = Container.get(GamesHandlerService);
    protected rackService = Container.get(RackService);
    protected wordSolver: WordSolver;
    protected isNotTurn: boolean = false;
    private timer: number;

    constructor(roomPlayer: RoomPlayer, protected botInfo: BotInformation) {
        super(roomPlayer);
        this.timer = botInfo.timer;
        this.wordSolver = new WordSolver(botInfo.dictionaryValidation);
    }

    setGame(game: Game): void {
        this.game = game;
        if (game.turn.activePlayer?.username === this.player.user.username) this.playTurn();
    }

    // Reason : virtual method that is reimplemented in child classes
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    playTurn(): void {
        return;
    }

    start(): void {
        this.game.turn.countdown.subscribe((countdown) => {
            this.countUp = this.timer - (countdown as number);
            if (this.countUp === Constant.TIME_SKIP && this.player.user === this.game.turn.activePlayer) this.skipTurn();
        });
        this.game.turn.endTurn.subscribe((activePlayer) => {
            this.isNotTurn = false;
            if (activePlayer === this.player.user.username) {
                this.countUp = 0;
                this.playTurn();
            }
        });
    }

    skipTurn(): void {
        if (this.game === undefined || this.isNotTurn) return;
        this.game.skip(this.player.user.username);
        this.isNotTurn = true;
    }

    convertToRealPlayer(observer: RoomPlayer): RealPlayer {
        const player = new RealPlayer(observer);
        player.game = this.game;
        player.rack = this.rack;
        player.score = this.score;
        player.objectives = this.objectives;
        player.fiveLettersPlacedCount = this.fiveLettersPlacedCount;
        player.clueCommandUseCount = this.clueCommandUseCount;
        return player;
    }

    unsubscribeObservables(): void {
        this.game.turn.countdown.unsubscribe();
        this.game.turn.endTurn.unsubscribe();
    }

    protected placeWord(commandInfo: PlaceWordCommandInfo): void {
        if (commandInfo === undefined || this.isNotTurn) {
            this.skipTurn();
            return;
        }
        this.emitPlaceCommand(commandInfo);
        this.isNotTurn = true;
    }

    protected processWordSolver(): Map<PlaceWordCommandInfo, number> {
        this.wordSolver.setGameboard(this.game.gameboard);
        return this.wordSolver.commandInfoScore(this.wordSolver.findAllOptions(this.rackToString()));
    }

    protected emitPlaceCommand(randomCommandInfo: PlaceWordCommandInfo): void {
        // this.game.placeWord(randomCommandInfo, this.getInformation());
        this.play(randomCommandInfo);
        // this.game.turn.resetSkipCounter();
        // this.game.turn.end();
        this.socketManager.emitRoom(this.botInfo.roomId, SocketEvents.LetterReserveUpdated, this.game.letterReserve.lettersReserve);
    }

    protected getRandomNumber(maxNumber: number): number {
        return Math.floor(Math.random() * maxNumber + 1);
    }

    private play(randomCommandInfo: PlaceWordCommandInfo) {
        const gamePlayer = this as GamePlayer;
        if (!gamePlayer) return;
        const game = gamePlayer.game;
        if (!game) return;
        const placement: Word = this.gameValidationService.verifyPlaceWordCommand(gamePlayer, randomCommandInfo) as Word;
        // TODO: Remove this if when lettre blanche is fixed
        if (!(placement instanceof Word)) {
            return;
        }
        const wordPlacementResult = game.letterPlacement.placeWord(placement, randomCommandInfo, gamePlayer, game.gameboard);

        // Update rack
        if (wordPlacementResult.hasPassed) {
            this.rackService.updatePlayerRack(randomCommandInfo.letters, gamePlayer.rack);
            game.giveNewLetterToRack(gamePlayer, randomCommandInfo.letters.length, wordPlacementResult);
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
    }
}
