import { GamePlayer } from '@app/classes/player/player.class';
import { Word } from '@common/classes/word.class';
import { WordPlacementResult } from '@app/interfaces/word-placement-result';
import { ErrorType } from '@app/services/games-management/game-validation.service';
import { Gameboard } from '@common/classes/gameboard.class';
import { Coordinate } from '@common/interfaces/coordinate';
import { PlaceWordCommandInfo } from '@common/interfaces/place-word-command-info';
import { DictionaryValidation } from './dictionary-validation.class';

const MIDDLE_X = 8;
const MIDDLE_Y = 8;

export class LetterPlacement {
    constructor(private dictionaryValidation: DictionaryValidation) {}

    verifyWordPlacement(commandInfo: PlaceWordCommandInfo, gameboard: Gameboard): Word | ErrorType {
        if (!this.validateCommandCoordinate(commandInfo.firstCoordinate, gameboard)) return ErrorType.CommandCoordinateOutOfBounds;

        const commandWord = new Word(commandInfo, gameboard);
        if (!commandWord.isValid) return ErrorType.InvalidWordBuild;
        if (!this.isWordPlacedCorrectly(commandWord.wordCoords, gameboard)) return ErrorType.InvalidFirstWordPlacement;
        return commandWord;
    }

    placeWord(commandWord: Word, commandInfo: PlaceWordCommandInfo, player: GamePlayer, currentGameboard: Gameboard): WordPlacementResult {
        this.placeNewLettersOnBoard(commandInfo, commandWord, currentGameboard);

        const wordValidationResult = this.dictionaryValidation.validateWord(commandWord, currentGameboard);
        if (!wordValidationResult.points) {
            this.removeLettersFromBoard(commandWord, currentGameboard);
            return { hasPassed: false, gameboard: currentGameboard, invalidWords: wordValidationResult.invalidWords };
        }

        player.score += wordValidationResult.points;

        return { hasPassed: true, gameboard: currentGameboard, invalidWords: [] };
    }

    private validateCommandCoordinate(commandCoord: Coordinate, gameboard: Gameboard): boolean {
        if (!gameboard.getLetterTile(commandCoord).isOccupied) return gameboard.isWithinBoardLimits(commandCoord);
        return false;
    }

    private isWordPlacedCorrectly(letterCoords: Coordinate[], gameboard: Gameboard): boolean {
        if (this.isFirstTurn(gameboard)) return this.isFirstTurnPlacementValid(letterCoords);
        else return this.isWordAttachedToBoardLetter(letterCoords, gameboard);
    }

    private isFirstTurn(gameboard: Gameboard): boolean {
        return gameboard.gameboardTiles.every((coord) => coord.isOccupied === false);
    }

    private isFirstTurnPlacementValid(letterCoords: Coordinate[]): boolean {
        const coordList: Coordinate[] = new Array();
        letterCoords.forEach((coord) => {
            coordList.push({ x: coord.x, y: coord.y });
        });

        return this.containsMiddleCoord(coordList);
    }

    private containsMiddleCoord(coordList: Coordinate[]): boolean {
        return coordList.some((element) => element.x === MIDDLE_X && element.y === MIDDLE_Y);
    }

    private isWordAttachedToBoardLetter(letterCoords: Coordinate[], gameboard: Gameboard): boolean {
        let lettersWithAdjacencyCount = 0;
        letterCoords.forEach((coord) => {
            if (this.areNeighborTilesOccupied(coord, gameboard)) lettersWithAdjacencyCount++;
        });

        if (lettersWithAdjacencyCount === 0) return false;
        else return true;
    }

    private areNeighborTilesOccupied(coord: Coordinate, gameboard: Gameboard): boolean {
        return (
            (gameboard.getLetterTile({ x: coord.x, y: coord.y - 1 }).isOccupied && gameboard.isWithinBoardLimits({ x: coord.x, y: coord.y - 1 })) ||
            (gameboard.getLetterTile({ x: coord.x, y: coord.y + 1 }).isOccupied && gameboard.isWithinBoardLimits({ x: coord.x, y: coord.y + 1 })) ||
            (gameboard.getLetterTile({ x: coord.x - 1, y: coord.y }).isOccupied && gameboard.isWithinBoardLimits({ x: coord.x - 1, y: coord.y })) ||
            (gameboard.getLetterTile({ x: coord.x + 1, y: coord.y }).isOccupied && gameboard.isWithinBoardLimits({ x: coord.x + 1, y: coord.y }))
        );
    }

    private placeNewLettersOnBoard(commandInfo: PlaceWordCommandInfo, commandWord: Word, gameboard: Gameboard) {
        const commandLettersCopy = commandInfo.letters.slice();
        commandWord.newLetterCoords.forEach((coord) => {
            gameboard.placeLetter(coord, commandLettersCopy[0]);
            if (commandLettersCopy[0] === commandLettersCopy[0].toUpperCase()) gameboard.getLetterTile(coord).points = 0;
            commandLettersCopy.shift();
        });
    }

    private removeLettersFromBoard(commandWord: Word, gameboard: Gameboard) {
        commandWord.newLetterCoords.forEach((coord) => gameboard.removeLetter(coord));
    }
}
