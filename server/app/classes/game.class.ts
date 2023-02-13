import { Gameboard } from '@app/classes/gameboard.class';
import { LetterReserve } from '@app/classes/letter-reserve.class';
import { ObjectivesHandler } from '@app/classes/objectives-handler.class';
import { Player } from '@app/classes/player/player.class';
import { Turn } from '@app/classes/turn.class';
import { Word } from '@app/classes/word.class';
import { PlaceLettersReturn } from '@app/interfaces/place-letters-return';
import { CommandInfo } from '@common/interfaces/command-info';
import { Letter } from '@common/interfaces/letter';
import { DictionaryValidation } from './dictionary-validation.class';
import { LetterPlacement } from './letter-placement.class';
import { WordSolver } from './word-solver.class';

const MAX_QUANTITY = 7;

export class Game {
    gameboard: Gameboard;
    gameMode: string;
    beginningTime: Date;
    isGameFinish: boolean;
    isGameAbandoned: boolean;
    isModeSolo: boolean;
    objectivesHandler: ObjectivesHandler;
    dictionaryValidation: DictionaryValidation;
    wordSolver: WordSolver;
    letterPlacement: LetterPlacement;

    constructor(
        player1: Player,
        player2: Player,
        public turn: Turn,
        public letterReserve: LetterReserve,
        public isMode2990: boolean,
        dictionaryValidation: DictionaryValidation,
        letterPlacement: LetterPlacement,
        wordSolver: WordSolver,
    ) {
        this.start(player1, player2);
        this.beginningTime = new Date();
        this.gameboard = new Gameboard();
        this.isGameFinish = false;
        this.isModeSolo = false;
        if (isMode2990) this.objectivesHandler = new ObjectivesHandler(player1, player2);
        this.isGameAbandoned = false;
        this.gameMode = '';
        this.dictionaryValidation = dictionaryValidation;
        this.letterPlacement = letterPlacement;
        this.wordSolver = wordSolver;
    }

    start(player1: Player, player2: Player): void {
        this.letterReserve.generateLetters(MAX_QUANTITY, player1.rack);
        this.letterReserve.generateLetters(MAX_QUANTITY, player2.rack);
        this.turn.determinePlayer(player1, player2);
        this.turn.start();
    }

    end(): void {
        this.turn.end(true);
    }

    skip(playerName: string): boolean {
        if (!this.turn.validating(playerName)) return false;
        this.turn.skipTurn();
        return true;
    }

    play(player: Player, commandInfo: CommandInfo): PlaceLettersReturn | string {
        if (commandInfo.letters.length === 1) commandInfo.isHorizontal = undefined;
        let placeLettersReturn: PlaceLettersReturn = { hasPassed: false, gameboard: this.gameboard, invalidWords: [] as Word[] };
        const numberOfLetterPlaced = commandInfo.letters.length;

        if (this.turn.validating(player.name)) {
            const validationInfo = this.letterPlacement.globalCommandVerification(commandInfo, this.gameboard, player);
            const newWord = validationInfo[0];
            const errorType = validationInfo[1] as string;
            if (errorType !== null) {
                this.turn.resetSkipCounter();
                return errorType;
            }
            placeLettersReturn = this.letterPlacement.placeLetters(newWord, commandInfo, player, this.gameboard);
            this.giveNewLetterToRack(player, numberOfLetterPlaced, placeLettersReturn);
            this.endOfGameVerification(player);
        }
        return placeLettersReturn;
    }

    exchange(letters: string[], player: Player): Letter[] {
        if (this.turn.validating(player.name)) {
            player.rack = this.letterReserve.exchangeLetter(letters, player.rack);
            this.turn.resetSkipCounter();
            this.turn.end();
            return player.rack;
        }
        return [];
    }

    abandon(): void {
        this.end();
        this.isGameAbandoned = true;
    }

    private giveNewLetterToRack(player: Player, numberOfLetterPlaced: number, placeLettersReturn: PlaceLettersReturn) {
        if (!placeLettersReturn.hasPassed) return;
        if (!this.letterReserve.isEmpty() && this.letterReserve.totalQuantity() < numberOfLetterPlaced) {
            player.rack = this.letterReserve.generateLetters(this.letterReserve.totalQuantity(), player.rack);
        } else if (!this.letterReserve.isEmpty()) {
            player.rack = this.letterReserve.generateLetters(numberOfLetterPlaced, player.rack);
        }
    }

    private endOfGameVerification(player: Player) {
        if (player.rackIsEmpty() && this.letterReserve.isEmpty()) {
            this.end();
            return;
        }
        this.turn.resetSkipCounter();
        this.turn.end();
    }
}
