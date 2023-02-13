import { Gameboard } from '@app/classes/gameboard.class';
import { LetterTreeNode } from '@app/classes/trie/letter-tree-node.class';
import { LetterTree } from '@app/classes/trie/letter-tree.class';
import { Word } from '@app/classes/word.class';
import { ValidateWordReturn } from '@app/interfaces/validate-word-return';
import * as constants from '@common/constants/board-info';
import { CommandInfo } from '@common/interfaces/command-info';
import { Coordinate } from '@common/interfaces/coordinate';
import { DictionaryValidation } from './dictionary-validation.class';
const ALPHABET_LETTERS = 'abcdefghijklmnopqrstuvwxyz';
const MAX_LETTERS_LIMIT = 7;

export class WordSolver {
    private trie: LetterTree;
    private gameboard: Gameboard;
    private legalLetterForBoardTiles: Map<Coordinate, string[]> = new Map();
    private isHorizontal: boolean;
    private commandInfoList: CommandInfo[] = new Array();
    private rack: string[];
    private anchors: Coordinate[];
    private dictionaryValidation: DictionaryValidation;

    constructor(dictionaryValidation: DictionaryValidation) {
        this.dictionaryValidation = dictionaryValidation;
        this.trie = this.dictionaryValidation.trie;
    }

    setGameboard(gameboard: Gameboard) {
        this.gameboard = gameboard;
    }

    findAllOptions(rack: string[]): CommandInfo[] {
        this.rack = rack;
        this.commandInfoList.length = 0;

        for (const direction of [true, false]) {
            this.isHorizontal = direction;
            this.anchors = this.gameboard.findAnchors();
            this.legalLetterForBoardTiles = this.findLettersForBoardTiles();
            this.firstTurnOrEmpty();
            this.findPossibleWordForEachAnchor();
        }
        return this.commandInfoList;
    }

    commandInfoScore(commandInfoList: CommandInfo[]): Map<CommandInfo, number> {
        const commandInfoMap: Map<CommandInfo, number> = new Map();
        commandInfoList.forEach((commandInfo) => {
            const word = new Word(commandInfo, this.gameboard);
            this.placeLettersOnBoard(word, commandInfo);
            const placementScore: ValidateWordReturn = this.dictionaryValidation.validateWord(word, this.gameboard);
            commandInfoMap.set(commandInfo, placementScore.points);
            this.removeLetterFromBoard(word);
        });
        return commandInfoMap;
    }

    private findPossibleWordForEachAnchor() {
        for (const anchor of this.anchors) {
            const beforeAnchor: Coordinate | null = this.decrementCoord(anchor, this.isHorizontal);
            if (beforeAnchor === null) {
                this.extendWordAfterAnchor('', this.dictionaryValidation.trie.root, anchor, false);
                continue;
            }
            if (this.gameboard.getLetterTile(beforeAnchor).isOccupied) this.checkIfPartialWordExistInTrie(anchor, beforeAnchor);
            else this.findWordPartBeforeAnchor('', this.trie.root, anchor, this.getLimitNumber(beforeAnchor, this.anchors));
        }
    }

    private checkIfPartialWordExistInTrie(currentAnchor: Coordinate, beforeAnchor: Coordinate) {
        const partialWord = this.buildPartialWord(beforeAnchor);
        const partialWordNode: LetterTreeNode | null = this.trie.lookUp(partialWord);
        if (partialWordNode !== null) this.extendWordAfterAnchor(partialWord, partialWordNode, currentAnchor, false);
    }

    private placeLettersOnBoard(word: Word, commandInfo: CommandInfo) {
        const commandLettersCopy = commandInfo.letters.slice();
        word.newLetterCoords.forEach((coord) => {
            this.gameboard.placeLetter(coord, commandLettersCopy[0]);
            if (commandLettersCopy[0] === commandLettersCopy[0].toUpperCase()) this.gameboard.getLetterTile(coord).points = 0;
            commandLettersCopy.shift();
        });
    }

    private removeLetterFromBoard(word: Word) {
        word.newLetterCoords.forEach((coord) => {
            this.gameboard.removeLetter(coord);
        });
    }

    private createCommandInfo(word: string, lastPosition: Coordinate) {
        let wordIndex = word.length - 1;
        let wordCopy = word.slice();
        const placedLetters: string[] = [];
        let firstCoordinate: Coordinate = lastPosition;
        while (wordIndex >= 0) {
            if (!this.gameboard.getLetterTile(lastPosition).isOccupied) {
                firstCoordinate = lastPosition;
                placedLetters.unshift(wordCopy.slice(wordCopy.length - 1));
            }
            wordCopy = wordCopy.slice(0, constants.INVALID_INDEX);
            wordIndex--;
            if (wordIndex >= 0) lastPosition = this.decrementCoord(lastPosition, this.isHorizontal) as Coordinate;
        }
        this.commandInfoList.push({
            firstCoordinate,
            isHorizontal: this.isHorizontal,
            letters: placedLetters,
        } as CommandInfo);
    }

    private firstTurnOrEmpty() {
        if (!this.anchors.length) {
            const anchor: Coordinate = { x: 8, y: 8 } as Coordinate;
            this.findWordPartBeforeAnchor('', this.trie.root, anchor, MAX_LETTERS_LIMIT);
        }
    }

    private findWordPartBeforeAnchor(partialWord: string, currentNode: LetterTreeNode, anchor: Coordinate, limit: number) {
        this.extendWordAfterAnchor(partialWord, currentNode, anchor, false);
        if (limit <= 0) return;
        for (const childLetter of currentNode.children.keys()) {
            if (this.rack.includes(childLetter) || this.rackHasBlankLetter())
                this.findPreviousChildLetter(childLetter, anchor, partialWord, currentNode, limit);
        }
    }

    private rackHasBlankLetter(): boolean {
        return this.rack.includes('*') ? true : false;
    }

    private findPreviousChildLetter(childLetter: string, anchor: Coordinate, partialWord: string, currentNode: LetterTreeNode, limit: number) {
        const currentLetterFromRack = this.rack.includes(childLetter) ? childLetter : '*';
        const currentLetterFromRackValue = currentLetterFromRack === '*' ? childLetter.toUpperCase() : childLetter;

        this.removeLetterFormRack(currentLetterFromRack);
        this.findWordPartBeforeAnchor(
            partialWord + currentLetterFromRackValue,
            currentNode.children.get(childLetter) as LetterTreeNode,
            anchor,
            limit - 1,
        );
        this.restoreRack(currentLetterFromRack);
    }

    private extendWordAfterAnchor(partialWord: string, currentNode: LetterTreeNode, nextPosition: Coordinate, anchorFilled: boolean) {
        if (currentNode.isWord && this.isOutOfBoundsOrIsOccupied(nextPosition) && anchorFilled)
            this.createCommandInfo(partialWord, this.decrementCoord(nextPosition, this.isHorizontal) as Coordinate);
        if (nextPosition === null) return;
        if (!this.gameboard.getLetterTile(nextPosition).isOccupied) {
            this.addRackLetterToPartialWord(nextPosition, partialWord, currentNode);
            return;
        }
        this.addBoardLetterToPartialWord(nextPosition, partialWord, currentNode);
    }

    private isOutOfBoundsOrIsOccupied(nextPosition: Coordinate): boolean {
        return (
            nextPosition.x > constants.TOTAL_TILES_IN_COLUMN ||
            nextPosition.y > constants.TOTAL_TILES_IN_ROW ||
            !this.gameboard.getLetterTile(nextPosition).isOccupied
        );
    }

    private addRackLetterToPartialWord(nextPosition: Coordinate, partialWord: string, currentNode: LetterTreeNode) {
        for (const childLetter of currentNode.children.keys()) {
            if (this.letterIsInRackAndCanBePlaced(this.rack, childLetter, nextPosition)) {
                this.findNextChildLetter(childLetter, nextPosition, partialWord, currentNode);
            }
        }
    }
    private letterIsInRackAndCanBePlaced(rack: string[], childLetter: string, nextPosition: Coordinate): boolean | undefined {
        const isBlankLetter: boolean = rack.includes('*') ? true : false;
        const isChildLetterLegalHere = this.legalLetterForBoardTiles
            .get(this.gameboard.getLetterTile(nextPosition).coordinate)
            ?.includes(childLetter);
        return (rack.includes(childLetter) || isBlankLetter) && isChildLetterLegalHere;
    }

    private findNextChildLetter(childLetter: string, nextPosition: Coordinate, partialWord: string, currentNode: LetterTreeNode) {
        const currentLetterFromRack = this.rack.includes(childLetter) ? childLetter : '*';
        const currentLetterFromRackValue = currentLetterFromRack === '*' ? childLetter.toUpperCase() : childLetter;
        const nextPos = this.isHorizontal ? { x: nextPosition.x + 1, y: nextPosition.y } : { x: nextPosition.x, y: nextPosition.y + 1 };

        this.removeLetterFormRack(currentLetterFromRack);
        this.extendWordAfterAnchor(
            partialWord + currentLetterFromRackValue,
            currentNode.children.get(childLetter.toLocaleLowerCase()) as LetterTreeNode,
            nextPos,
            true,
        );
        this.restoreRack(currentLetterFromRack);
    }

    private removeLetterFormRack(letterToRemove: string): void {
        this.rack.splice(this.rack.indexOf(letterToRemove), 1);
    }

    private restoreRack(letterToRestore: string): void {
        this.rack.push(letterToRestore);
    }

    private addBoardLetterToPartialWord(nextPosition: Coordinate, partialWord: string, currentNode: LetterTreeNode) {
        const existingLetter: string = this.gameboard.getLetterTile(nextPosition).letter;
        if (!currentNode.children.has(existingLetter)) return;
        const nextPos = this.isHorizontal ? { x: nextPosition.x + 1, y: nextPosition.y } : { x: nextPosition.x, y: nextPosition.y + 1 };
        this.extendWordAfterAnchor(partialWord + existingLetter, currentNode.children.get(existingLetter) as LetterTreeNode, nextPos, true);
    }

    private findLettersForBoardTiles(): Map<Coordinate, string[]> {
        const result: Map<Coordinate, string[]> = new Map();
        for (const letterTile of this.gameboard.gameboardTiles) {
            if (!letterTile.isOccupied) {
                const legalHere: string[] = this.findLettersThatCanBePlacedOnTile(letterTile.coordinate);
                result.set(letterTile.coordinate, legalHere);
            }
        }
        return result;
    }

    private findLettersThatCanBePlacedOnTile(letterTileCoord: Coordinate): string[] {
        const lettersUpwards: string = this.findLetters(letterTileCoord, true);
        const lettersDownwards: string = this.findLetters(letterTileCoord, false);
        return this.setLegalHere(lettersUpwards, lettersDownwards);
    }

    private findLetters(coord: Coordinate, isUp: boolean): string {
        let letters = '';
        let scanPos = this.setScanPosition(coord, isUp);
        while (this.gameboard.getLetterTile(scanPos).isOccupied) {
            letters = this.addLetterToString(scanPos, letters, isUp);
            scanPos = this.setScanPosition(scanPos, isUp);
        }
        return letters;
    }

    private setScanPosition(coord: Coordinate, isUp: boolean): Coordinate {
        return isUp ? (this.decrementCoord(coord, !this.isHorizontal) as Coordinate) : (this.incrementCoord(coord, !this.isHorizontal) as Coordinate);
    }

    private addLetterToString(scanPos: Coordinate, letters: string, isUp: boolean): string {
        return isUp ? this.gameboard.getLetterTile(scanPos).letter + letters : letters + this.gameboard.getLetterTile(scanPos).letter;
    }

    private setLegalHere(lettersUpwards: string, lettersDownwards: string): string[] {
        return lettersUpwards.length === 0 && lettersDownwards.length === 0
            ? ALPHABET_LETTERS.split('')
            : (this.pushLetterToLegalHere(lettersUpwards, lettersDownwards) as string[]);
    }

    private pushLetterToLegalHere(lettersUpwards: string, lettersDownwards: string) {
        const legalHere: string[] = [];
        for (const letter of ALPHABET_LETTERS.split('')) if (this.trie.isWord(lettersUpwards + letter + lettersDownwards)) legalHere.push(letter);
        return legalHere;
    }

    private getLimitNumber(startPosition: Coordinate, anchors: Coordinate[]): number {
        let limit = 0;
        while (!this.gameboard.getLetterTile(startPosition).isOccupied && !anchors.includes(this.gameboard.getLetterTile(startPosition).coordinate)) {
            limit++;
            startPosition = this.decrementCoord(startPosition, this.isHorizontal) as Coordinate;
            if (startPosition === null) break;
        }
        return limit;
    }

    private buildPartialWord(scanCoord: Coordinate): string {
        let partialWord = '';
        while (this.gameboard.getLetterTile(scanCoord).isOccupied) {
            partialWord = this.gameboard.getLetterTile(scanCoord).letter + partialWord;
            scanCoord = this.decrementCoord(scanCoord, this.isHorizontal) as Coordinate;
        }
        return partialWord;
    }

    private decrementCoord(coord: Coordinate, isHorizontal: boolean): Coordinate | null {
        if (isHorizontal && coord.x !== 1) return { x: coord.x - 1, y: coord.y } as Coordinate;
        if (!isHorizontal && coord.y !== 1) return { x: coord.x, y: coord.y - 1 } as Coordinate;
        return null;
    }

    private incrementCoord(coord: Coordinate, isHorizontal: boolean): Coordinate | null {
        if (isHorizontal && coord.x !== constants.TOTAL_TILES_IN_COLUMN) return { x: coord.x + 1, y: coord.y } as Coordinate;
        if (!isHorizontal && coord.y !== constants.TOTAL_TILES_IN_ROW) return { x: coord.x, y: coord.y + 1 } as Coordinate;
        return null;
    }
}
