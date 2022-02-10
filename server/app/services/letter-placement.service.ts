/* eslint-disable no-unused-expressions */
/* eslint-disable prettier/prettier */

import { GameboardCoordinate } from '@app/classes/gameboard-coordinate.class';
import { GameBoard } from '@app/classes/gameboard.class';
import { Player } from '@app/classes/player';
import { Word } from '@app/classes/word.class';
import { PlacementCommandInfo } from '@app/command-info';
import { Letter } from '@app/letter';
import { Container, Service } from 'typedi';
import { GameboardCoordinateValidationService } from './coordinate-validation.service';
import { DictionaryValidationService } from './dictionary-validation.service';
import { WordFinderService } from './word-finder.service';

@Service()
export class LetterPlacementService {
    validateCoordService = Container.get(GameboardCoordinateValidationService);
    wordFinderService = Container.get(WordFinderService);
    dictionaryService = Container.get(DictionaryValidationService);

    placeLetter(player: Player, commandInfo: PlacementCommandInfo, gameboard: GameBoard): [boolean, GameBoard] {
        const coords = this.validateCoordService.validateGameboardCoordinate(commandInfo, gameboard);
        // if there is no placed letters, return false
        if (coords.length === 0) return [false, gameboard];

        const tempPlayerRack = this.createTempRack(player);
        const letters = this.associateLettersWithRack(coords, tempPlayerRack);
        // Verify if the placed Letters are in the player's rack
        if (coords.length !== letters.length) return [false, gameboard];

        // Update the player's rack
        player.rack = tempPlayerRack;

        // Placer letters on gameboard
        for (const coord of coords) {
            gameboard.placeLetter(coord);
        }

        const wordList: Word[] = this.wordFinderService.findNewWords(gameboard, coords);
        const validateWord: number = this.dictionaryService.validateWords(wordList);
        // If there is no validateWord
        if (validateWord === 0) return [false, gameboard];

        return [true, gameboard];
    }

    private createTempRack(player: Player): Letter[] {
        const tempPlayerRack: Letter[] = [];
        for (const letter of player.rack) {
            tempPlayerRack.push(letter);
        }
        return tempPlayerRack;
    }

    private associateLettersWithRack(placedLettersCoord: GameboardCoordinate[], rack: Letter[]): (Letter | undefined)[] {
        const tempRack = rack;
        const letters = placedLettersCoord.map((coord) => {
            const index = tempRack.findIndex((letter) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                letter.stringChar === coord.letter.stringChar;
            });
            if (index < 0) return;
            else {
                const tempLetter = tempRack[index];
                delete tempRack[index];
                return tempLetter;
            }
        });
        return letters;
    }
}
