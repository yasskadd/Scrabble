import { Game } from '@app/classes/game.class';
import { WordSolver } from '@app/classes/word-solver.class';
import * as Constant from '@app/constants/bot';
import { BotInformation } from '@app/interfaces/bot-information';
import { SocketManager } from '@app/services/socket/socket-manager.service';
import { SocketEvents } from '@common/constants/socket-events';
import { CommandInfo } from '@common/interfaces/command-info';
import { Container } from 'typedi';
import { Player } from './player.class';

export class Bot extends Player {
    isPlayerOne: boolean;
    roomId: string;
    game: Game;
    protected countUp: number = 0;
    protected socketManager: SocketManager = Container.get(SocketManager);
    protected wordSolver: WordSolver;
    protected playedTurned: boolean = false;
    private timer: number;

    constructor(isPlayerOne: boolean, name: string, protected botInfo: BotInformation) {
        super(name);
        this.isPlayerOne = isPlayerOne;
        this.room = botInfo.roomId;
        this.timer = botInfo.timer;
        this.wordSolver = new WordSolver(botInfo.dictionaryValidation);
    }

    setGame(game: Game): void {
        this.game = game;
        if (game.turn.activePlayer === this.name) this.playTurn();
    }

    // Reason : virtual method that is reimplemented in child classes
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    playTurn(): void {
        return;
    }

    start(): void {
        this.game.turn.countdown.subscribe((countdown) => {
            this.countUp = this.timer - (countdown as number);
            if (this.countUp === Constant.TIME_SKIP && this.name === this.game.turn.activePlayer) this.skipTurn();
        });
        this.game.turn.endTurn.subscribe((activePlayer) => {
            this.playedTurned = false;
            if (activePlayer === this.name) {
                this.countUp = 0;
                this.playTurn();
            }
        });
    }

    skipTurn(): void {
        if (this.game === undefined || this.playedTurned) return;
        this.socketManager.emitRoom(this.botInfo.roomId, SocketEvents.GameMessage, '!passer');
        this.game.skip(this.name);
        this.playedTurned = true;
    }

    protected play(commandInfo: CommandInfo): void {
        if (commandInfo === undefined || this.playedTurned) {
            this.skipTurn();
            return;
        }
        this.emitPlaceCommand(commandInfo);
        this.playedTurned = true;
    }

    protected processWordSolver(): Map<CommandInfo, number> {
        this.wordSolver.setGameboard(this.game.gameboard);
        return this.wordSolver.commandInfoScore(this.wordSolver.findAllOptions(this.rackToString()));
    }

    protected emitPlaceCommand(randomCommandInfo: CommandInfo): void {
        const coordString = `${String.fromCharCode(Constant.CHAR_ASCII + randomCommandInfo.firstCoordinate.y)}${randomCommandInfo.firstCoordinate.x}`;
        const placeCommand = `!placer ${coordString}${randomCommandInfo.isHorizontal ? 'h' : 'v'} ${randomCommandInfo.letters.join('')}`;
        this.socketManager.emitRoom(this.botInfo.roomId, SocketEvents.GameMessage, placeCommand);
        this.game.play(this, randomCommandInfo);
        this.socketManager.emitRoom(this.botInfo.roomId, SocketEvents.LetterReserveUpdated, this.game.letterReserve.lettersReserve);
    }

    protected getRandomNumber(maxNumber: number): number {
        return Math.floor(Math.random() * maxNumber + 1);
    }
}
