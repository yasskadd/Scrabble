import { LetterReserve } from '@app/classes/letter-reserve.class';
import { ObjectivesHandler } from '@app/classes/objectives-handler.class';
import { GamePlayer } from '@app/classes/player/player.class';
import { Turn } from '@app/classes/turn.class';
import { WordPlacementResult } from '@app/interfaces/word-placement-result';
import { Gameboard } from '@common/classes/gameboard.class';
import { Letter } from '@common/interfaces/letter';
import { PlaceWordCommandInfo } from '@common/interfaces/place-word-command-info';
import { DictionaryValidation } from './dictionary-validation.class';
import { LetterPlacement } from './letter-placement.class';
import { WordSolver } from './word-solver.class';

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

    isMode2990: boolean;

    constructor(
        public turn: Turn,
        public letterReserve: LetterReserve,
        gameMode: string,
        isSoloMode: boolean,
        players: GamePlayer[],
        dictionaryValidation: DictionaryValidation,
        letterPlacement: LetterPlacement,
        wordSolver: WordSolver,
    ) {
        this.gameMode = gameMode;
        this.isModeSolo = isSoloMode;
        this.beginningTime = new Date();
        this.gameboard = new Gameboard();
        this.isGameFinish = false;
        this.isModeSolo = false;
        this.isGameAbandoned = false;
        this.gameMode = '';
        this.dictionaryValidation = dictionaryValidation;
        this.letterPlacement = letterPlacement;
        this.wordSolver = wordSolver;
    }

    terminate(): void {
        this.turn.end(true);
    }

    skip(playerName: string): boolean {
        if (!this.turn.validating(playerName)) return false;

        this.turn.skipTurn();
        return true;
    }

    placeWord(commandInfo: PlaceWordCommandInfo) {
        const currentCoords = commandInfo.firstCoordinate;

        commandInfo.letters.forEach((letter) => {
            while (this.gameboard.getLetterTile(currentCoords).isOccupied) {
                if (commandInfo.isHorizontal) currentCoords.x++;
                else currentCoords.y++;
            }
            this.gameboard.placeLetter(currentCoords, letter);
        });
    }

    exchange(letters: string[], gamePlayer: GamePlayer): Letter[] {
        if (this.turn.validating(gamePlayer.player.user.username)) {
            gamePlayer.rack = this.letterReserve.exchangeLetter(letters, gamePlayer.rack);
            this.turn.resetSkipCounter();
            this.turn.end();
            return gamePlayer.rack;
        }
        return [];
    }

    abandon(): void {
        this.terminate();
        this.isGameAbandoned = true;
    }

    giveNewLetterToRack(player: GamePlayer, numberOfLetterPlaced: number, placeLettersReturn: WordPlacementResult) {
        if (!placeLettersReturn.hasPassed) return;
        if (!this.letterReserve.isEmpty() && this.letterReserve.totalQuantity() < numberOfLetterPlaced) {
            player.rack = this.letterReserve.generateLetters(this.letterReserve.totalQuantity(), player.rack);
        } else if (!this.letterReserve.isEmpty()) {
            player.rack = this.letterReserve.generateLetters(numberOfLetterPlaced, player.rack);
        }
    }

    concludeGameVerification(player: GamePlayer) {
        if (player.rackIsEmpty() && this.letterReserve.isEmpty()) {
            this.terminate();
            return;
        }
        this.turn.resetSkipCounter();
        this.turn.end();
    }
}
