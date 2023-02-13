import { Player } from '@app/classes/player/player.class';
import { Word } from '@app/classes/word.class';
import * as ObjectivesInfo from '@app/constants/objectives-description';
import { SocketManager } from '@app/services/socket/socket-manager.service';
import { Objective } from '@common/interfaces/objective';
import { Container } from 'typedi';

const MINIMUM_LETTERS_ONE_VOWEL = 5;
const MINIMUM_LETTERS_10 = 10;
const MINIMUM_LETTERS_4 = 4;

export class ObjectivesHandler {
    players: [Player, Player];
    protected socketManager: SocketManager = Container.get(SocketManager);
    private objectivesMap: Map<Objective, CallableFunction> = new Map();

    constructor(player1: Player, player2: Player) {
        this.players = [player1, player2];
        this.setMapObjectives();
        this.attributeObjectives(player1, player2);
    }

    verifyObjectives(player: Player, allWordsFormed: Word[], numberOfLettersPlaced: number) {
        player.objectives.forEach((objective) => {
            if (objective.type === 'Word') this.verifyWordObjectives(objective, allWordsFormed, player);
            else if (objective.type === 'Turn') this.verifyTurnObjectives(objective, numberOfLettersPlaced, player);
        });
    }

    verifyWordObjectives(objective: Objective, allWordsFormed: Word[], player: Player): void {
        const objectiveVerificationFunction = this.objectivesMap.get(objective) as CallableFunction;
        if (objectiveVerificationFunction(allWordsFormed)) this.completeObjective(player, objective);
    }

    verifyTurnObjectives(objective: Objective, numberOfLettersPlaced: number, player: Player): void {
        const objectiveVerificationFunction = this.objectivesMap.get(objective) as CallableFunction;
        if (objectiveVerificationFunction(numberOfLettersPlaced, player)) this.completeObjective(player, objective);
    }

    attributeObjectives(player1: Player, player2: Player): void {
        const objectivesListCopy: Objective[] = [...ObjectivesInfo.objectivesList];
        const publicObjective1 = objectivesListCopy.splice(Math.floor(Math.random() * objectivesListCopy.length), 1)[0];
        publicObjective1.isPublic = true;
        const publicObjective2 = objectivesListCopy.splice(Math.floor(Math.random() * objectivesListCopy.length), 1)[0];
        publicObjective2.isPublic = true;
        const privateObjective1 = objectivesListCopy.splice(Math.floor(Math.random() * objectivesListCopy.length), 1)[0];
        privateObjective1.isPublic = false;
        const privateObjective2 = objectivesListCopy.splice(Math.floor(Math.random() * objectivesListCopy.length), 1)[0];
        privateObjective2.isPublic = false;
        player1.objectives.push(publicObjective1, publicObjective2, privateObjective1);
        player2.objectives.push(publicObjective1, publicObjective2, privateObjective2);
    }

    verifyClueCommandEndGame(players: Player[]) {
        if (!this.players[0].game.isMode2990) return;
        players.forEach((player) => {
            if (player.clueCommandUseCount === 0 && player.objectives.includes(ObjectivesInfo.clueCommandNeverUsed)) {
                player.score += ObjectivesInfo.clueCommandNeverUsed.points;
                this.socketManager.emitRoom(player.room, 'CompletedObjective', { objective: ObjectivesInfo.clueCommandNeverUsed, name: player.name });
            }
        });
    }

    private are5LettersPlacedTwice(numberOfLettersPlaced: number, player: Player) {
        if (player.fiveLettersPlacedCount === 1 && numberOfLettersPlaced > MINIMUM_LETTERS_4) {
            player.fiveLettersPlacedCount = 0;
            return true;
        }
        if (numberOfLettersPlaced > MINIMUM_LETTERS_4) player.fiveLettersPlacedCount++;
        else player.fiveLettersPlacedCount = 0;
        return false;
    }

    private isWordWithOneVowel(words: Word[]): boolean {
        let isWordWithOneVowel = false;
        const vowels = ['a', 'e', 'i', 'o', 'u', 'y'];
        for (const word of words) {
            let vowelCount = 0;
            const wordArray = word.stringFormat.toLowerCase().split('');
            wordArray.forEach((letter: string) => {
                if (vowels.includes(letter)) vowelCount++;
            });
            if (vowelCount === 1 && word.stringFormat.length > MINIMUM_LETTERS_ONE_VOWEL) {
                isWordWithOneVowel = true;
                ObjectivesInfo.oneVowelWord.points = word.points * 2;
            }
        }
        return isWordWithOneVowel;
    }

    private isPalindromicWord(words: Word[]): boolean {
        let isPalindromicWord = false;
        for (const word of words) {
            const reverseWord: string = word.stringFormat.toLowerCase().split('').reverse().join('');
            if (word.stringFormat.toLowerCase() === reverseWord && word.stringFormat.length > 2) isPalindromicWord = true;
        }
        return isPalindromicWord;
    }

    private isWordAlphabetical(words: Word[]): boolean {
        let isAlphabetical = false;
        words.forEach((word) => {
            if (word.stringFormat.toLowerCase() === word.stringFormat.toLowerCase().split('').sort().join('')) isAlphabetical = true;
        });
        return isAlphabetical;
    }

    private isWordMoreThan10Letters(words: Word[]): boolean {
        let isMoreThan10 = false;
        words.forEach((word) => {
            if (word.stringFormat.length > MINIMUM_LETTERS_10) isMoreThan10 = true;
        });
        return isMoreThan10;
    }

    private isThreeWordsFormed(words: Word[]): boolean {
        if (words.length <= 2) return false;
        const roundPoints = words.reduce((a, c) => {
            return a + c.points;
        }, 0);
        ObjectivesInfo.threeWordsFormed.points = roundPoints * 2;
        return true;
    }

    private isSameWordTwoTimes(words: Word[]): boolean {
        const wordStringList: string[] = [];
        words.forEach((word: Word) => {
            wordStringList.push(word.stringFormat.toLowerCase());
        });
        return words.length !== new Set(wordStringList).size;
    }

    private setMapObjectives(): void {
        this.objectivesMap.set(ObjectivesInfo.oneVowelWord, this.isWordWithOneVowel);
        this.objectivesMap.set(ObjectivesInfo.palindromicWord, this.isPalindromicWord);
        this.objectivesMap.set(ObjectivesInfo.alphabeticalWord, this.isWordAlphabetical);
        this.objectivesMap.set(ObjectivesInfo.moreThan10Letters, this.isWordMoreThan10Letters);
        this.objectivesMap.set(ObjectivesInfo.threeWordsFormed, this.isThreeWordsFormed);
        this.objectivesMap.set(ObjectivesInfo.twoSameWords, this.isSameWordTwoTimes);
        this.objectivesMap.set(ObjectivesInfo.fiveLettersPlacedTwice, this.are5LettersPlacedTwice);
    }

    private addObjectivePoints(player: Player, objective: Objective): void {
        player.score += objective.points;
    }

    private completeObjective(player: Player, objective: Objective): void {
        if (objective.isPublic) {
            const firstPlayerObjectives: Objective[] = this.players[0].objectives;
            const secondPlayerObjectives: Objective[] = this.players[1].objectives;
            firstPlayerObjectives.splice(firstPlayerObjectives.indexOf(objective), 1);
            secondPlayerObjectives.splice(secondPlayerObjectives.indexOf(objective), 1);
        } else player.objectives.splice(player.objectives.indexOf(objective), 1);
        this.addObjectivePoints(player, objective);
        this.socketManager.emitRoom(player.room, 'CompletedObjective', { objective, name: player.name });
    }
}
