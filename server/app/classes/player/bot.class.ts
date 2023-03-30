import { Game } from '@app/classes/game.class';
import { WordSolver } from '@app/classes/word-solver.class';
import * as Constant from '@app/constants/bot';
import { BotInformation } from '@app/interfaces/bot-information';
import { SocketManager } from '@app/services/socket/socket-manager.service';
import { SocketEvents } from '@common/constants/socket-events';
import { PlaceWordCommandInfo } from '@common/interfaces/game-actions';
import { RoomPlayer } from '@common/interfaces/room-player';
import { Container } from 'typedi';
import { GamePlayer } from './player.class';

export class Bot extends GamePlayer {
    protected countUp: number = 0;
    protected socketManager: SocketManager = Container.get(SocketManager);
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
        console.log('Bot ' + this.player.user.username + ' is skipping his turn');
        this.game.skip(this.player.user.username);
        this.isNotTurn = true;
    }

    protected placeWord(commandInfo: PlaceWordCommandInfo): void {
        if (commandInfo === undefined || this.isNotTurn) {
            this.skipTurn();
            return;
        }
        console.log('Bot ' + this.player.user.username + ' is placing word ' + commandInfo.letters);
        this.emitPlaceCommand(commandInfo);
        this.isNotTurn = true;
    }

    protected processWordSolver(): Map<PlaceWordCommandInfo, number> {
        this.wordSolver.setGameboard(this.game.gameboard);
        return this.wordSolver.commandInfoScore(this.wordSolver.findAllOptions(this.rackToString()));
    }

    protected emitPlaceCommand(randomCommandInfo: PlaceWordCommandInfo): void {
        this.game.placeWord(randomCommandInfo);
        this.socketManager.emitRoom(this.botInfo.roomId, SocketEvents.LetterReserveUpdated, this.game.letterReserve.lettersReserve);
    }

    protected getRandomNumber(maxNumber: number): number {
        return Math.floor(Math.random() * maxNumber + 1);
    }
}
