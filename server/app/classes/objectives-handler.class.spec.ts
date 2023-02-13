/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable dot-notation */
import { Player } from '@app/classes/player/player.class';
import { Word } from '@app/classes/word.class';
import * as ObjectivesInfo from '@app/constants/objectives-description';
import { SocketManager } from '@app/services/socket/socket-manager.service';
import { Objective } from '@common/interfaces/objective';
import { expect } from 'chai';
import * as Sinon from 'sinon';
import { Game } from './game.class';
import { ObjectivesHandler } from './objectives-handler.class';

describe('Objectives Handler Tests', () => {
    let objectivesHandler: ObjectivesHandler;
    let socketManagerStub: Sinon.SinonStubbedInstance<SocketManager>;
    let player1: Player;
    let player2: Player;
    let wordStub1: Word;
    let wordStub2: Word;
    let wordStub3: Word;
    let mathRandomStub: Sinon.SinonStub;
    let spyCompleteObjectives: Sinon.SinonSpy;

    beforeEach(() => {
        const gameStub = Sinon.createStubInstance(Game) as Game & Sinon.SinonStubbedInstance<Game>;
        socketManagerStub = Sinon.createStubInstance(SocketManager);
        gameStub.isMode2990 = true;
        player1 = new Player('Rick');
        player1.game = gameStub;
        player2 = new Player('Morty');
        player2.game = gameStub;
        objectivesHandler = new ObjectivesHandler(player1, player2);
        objectivesHandler['socketManager'] = socketManagerStub as never;
        wordStub1 = {} as Word;
        wordStub1.stringFormat = 'banane';
        wordStub2 = {} as Word;
        wordStub2.stringFormat = 'pomme';
        wordStub3 = {} as Word;
        wordStub3.stringFormat = 'raisin';
        mathRandomStub = Sinon.stub(Math, 'random');
        spyCompleteObjectives = Sinon.spy(objectivesHandler, 'completeObjective' as keyof ObjectivesHandler);
    });

    afterEach(() => {
        Sinon.restore();
    });

    context('isSameWordTwoTimes() tests', () => {
        it('should return false if all words are different', () => {
            const words: Word[] = [wordStub1, wordStub2, wordStub3];
            expect(objectivesHandler['isSameWordTwoTimes'](words)).to.be.equal(false);
        });

        it('should return true if there is two times the same word', () => {
            const words: Word[] = [wordStub1, wordStub1, wordStub2];
            expect(objectivesHandler['isSameWordTwoTimes'](words)).to.be.equal(true);
        });

        it('should return true if there is two times the same words but letters are uppercase', () => {
            const upperCaseWord = {} as Word;
            upperCaseWord.stringFormat = 'BanAne';
            const words: Word[] = [wordStub1, upperCaseWord, wordStub3];
            expect(objectivesHandler['isSameWordTwoTimes'](words)).to.be.equal(true);
        });

        it('should return true if there is more than two times the same words', () => {
            const words: Word[] = [wordStub1, wordStub1, wordStub1];
            expect(objectivesHandler['isSameWordTwoTimes'](words)).to.be.equal(true);
        });
    });

    context('isThreeWordsFormed() Tests', () => {
        it('should return true if there is more than 2 words formed', () => {
            const words: Word[] = [wordStub1, wordStub2, wordStub3];
            expect(objectivesHandler['isThreeWordsFormed'](words)).to.be.equal(true);
        });

        it('should return false if there is 2 words or less formed', () => {
            const wordsList1: Word[] = [wordStub1, wordStub2];
            const wordsList2: Word[] = [wordStub1];
            expect(objectivesHandler['isThreeWordsFormed'](wordsList1) && objectivesHandler['isThreeWordsFormed'](wordsList2)).to.be.equal(false);
        });

        it('should correctly set points to ThreeWords objective', () => {
            wordStub1.points = 20;
            wordStub2.points = 30;
            const words: Word[] = [wordStub1, wordStub2, wordStub1];
            objectivesHandler['isThreeWordsFormed'](words);
            expect(ObjectivesInfo.threeWordsFormed.points).to.be.equal(140);
        });
    });

    context('isWordMoreThan10Letters() Tests', () => {
        it('should return true if there is a word that has more than 10 letters', () => {
            const wordWithMoreThan10Letters = {} as Word;
            wordWithMoreThan10Letters.stringFormat = 'exceptionnelle';
            const words: Word[] = [wordStub1, wordStub2, wordWithMoreThan10Letters];
            expect(objectivesHandler['isWordMoreThan10Letters'](words)).to.be.equal(true);
        });

        it('should return false if there is no words with more than 10 letters', () => {
            const words: Word[] = [wordStub1, wordStub2, wordStub3];
            expect(objectivesHandler['isWordMoreThan10Letters'](words)).to.be.equal(false);
        });
    });

    context('isWordAlphabetical() Tests', () => {
        it('should return true if there is an alphabetical word', () => {
            const alphabeticalWord = {} as Word;
            alphabeticalWord.stringFormat = 'acgkmz';
            const words: Word[] = [wordStub1, alphabeticalWord, wordStub3];
            expect(objectivesHandler['isWordAlphabetical'](words)).to.be.equal(true);
        });

        it('should return false if there is no alphabetical words', () => {
            const words: Word[] = [wordStub1, wordStub2, wordStub3];
            expect(objectivesHandler['isWordAlphabetical'](words)).to.be.equal(false);
        });
    });

    context('isPalindromicWord() Tests', () => {
        it('should return true if there is one palindromic word in the list', () => {
            const palindromicWord = {} as Word;
            palindromicWord.stringFormat = 'laval';
            const words: Word[] = [wordStub1, palindromicWord, wordStub3];
            expect(objectivesHandler['isPalindromicWord'](words)).to.be.equal(true);
        });

        it('should return false if there is not palindromic word in the list', () => {
            const words: Word[] = [wordStub1, wordStub2, wordStub3];
            expect(objectivesHandler['isPalindromicWord'](words)).to.be.equal(false);
        });

        it('should return true if there is a palindromic word with uppercase letters', () => {
            const palindromicWord = {} as Word;
            palindromicWord.stringFormat = 'LAval';
            const words: Word[] = [palindromicWord, wordStub2, wordStub3];
            expect(objectivesHandler['isPalindromicWord'](words)).to.be.equal(true);
        });
    });

    context('isWordWithOneVowel() Tests', () => {
        it('should return true if there is one word with one vowel in the list of words', () => {
            const wordWithOneVowel = {} as Word;
            wordWithOneVowel.stringFormat = 'fsdgil';
            const words: Word[] = [wordStub1, wordWithOneVowel, wordStub3];
            expect(objectivesHandler['isWordWithOneVowel'](words)).to.be.equal(true);
        });

        it('should return false if there is no word with only one vowels', () => {
            const words: Word[] = [wordStub1, wordStub2, wordStub3];
            expect(objectivesHandler['isWordWithOneVowel'](words)).to.be.equal(false);
        });

        it('should return true if the only vowel in the word is uppercase', () => {
            const wordWithOneVowel = {} as Word;
            wordWithOneVowel.stringFormat = 'sphYnx';
            const words: Word[] = [wordStub1, wordWithOneVowel, wordStub3];
            expect(objectivesHandler['isWordWithOneVowel'](words)).to.be.equal(true);
        });

        it('should correctly set points to one vowel objective', () => {
            const wordWithOneVowel = {} as Word;
            wordWithOneVowel.stringFormat = 'sphYnx';
            wordWithOneVowel.points = 10;
            const words: Word[] = [wordStub1, wordWithOneVowel, wordStub3];
            objectivesHandler['isWordWithOneVowel'](words);
            expect(ObjectivesInfo.oneVowelWord.points).to.be.equal(20);
        });
    });

    context('are5LettersPlacedTwice() Tests', () => {
        it('should return false if there is less than 5 letters placed and fiveLettersPlacedCount is set to 0', () => {
            player1.fiveLettersPlacedCount = 0;
            expect(objectivesHandler['are5LettersPlacedTwice'](4, player1)).to.be.equal(false);
        });

        it('should return false if there is less than 5 letters placed and fiveLettersPlacedCount is set to 1', () => {
            player1.fiveLettersPlacedCount = 1;
            expect(objectivesHandler['are5LettersPlacedTwice'](4, player1)).to.be.equal(false);
        });

        it('should return false if there is more than 5 letters placed and fiveLettersPlacedCount is set to 0', () => {
            player1.fiveLettersPlacedCount = 0;
            expect(objectivesHandler['are5LettersPlacedTwice'](10, player1)).to.be.equal(false);
        });

        it('should return true if there is more than 10 letters placed and fiveLettersPlacedCount is set to 1', () => {
            player1.fiveLettersPlacedCount = 1;
            expect(objectivesHandler['are5LettersPlacedTwice'](10, player1)).to.be.equal(true);
        });
    });

    it('setMapObjectives() should correctly set objectives to map with the corresponding function', () => {
        objectivesHandler['objectivesMap'].clear();
        objectivesHandler['setMapObjectives']();
        expect(objectivesHandler['objectivesMap'].size).to.be.equal(7);
    });

    it('addObjectivePoints() should correctly set points to player', () => {
        const oneVowelObjective = ObjectivesInfo.oneVowelWord;
        player1.score = 0;
        objectivesHandler['addObjectivePoints'](player1, oneVowelObjective);
        expect(player1.score).to.be.equal(15);
    });

    context('attributeObjectives() Tests', () => {
        beforeEach(() => {
            player1.objectives = [];
            player2.objectives = [];
        });

        it('should attribute 3 objectives to each player', () => {
            objectivesHandler.attributeObjectives(player1, player2);
            expect(player1.objectives.length && player2.objectives.length).to.be.equal(3);
        });

        it('should give 2 public objectives and 1 private objective to the first player', () => {
            objectivesHandler.attributeObjectives(player1, player2);
            expect(player1.objectives[0].isPublic && player1.objectives[1].isPublic).to.be.equal(true);
            expect(player1.objectives[2].isPublic).to.be.equal(false);
        });

        it('should give 2 public objectives and 1 private objective to the second player', () => {
            objectivesHandler.attributeObjectives(player1, player2);
            expect(player2.objectives[0].isPublic && player2.objectives[1].isPublic).to.be.equal(true);
            expect(player2.objectives[2].isPublic).to.be.equal(false);
        });

        it('should give random objectives to each player', () => {
            mathRandomStub.returns(0);
            const expectedObjectivesPlayer1: Objective[] = [
                ObjectivesInfo.oneVowelWord,
                ObjectivesInfo.palindromicWord,
                ObjectivesInfo.alphabeticalWord,
            ];
            const expectedObjectivesPlayer2: Objective[] = [
                ObjectivesInfo.oneVowelWord,
                ObjectivesInfo.palindromicWord,
                ObjectivesInfo.moreThan10Letters,
            ];
            objectivesHandler.attributeObjectives(player1, player2);
            expect(player1.objectives).to.be.eql(expectedObjectivesPlayer1);
            expect(player2.objectives).to.be.eql(expectedObjectivesPlayer2);
        });
    });

    context('completeObjective() Tests', () => {
        beforeEach(() => {
            player1.objectives = [];
            player2.objectives = [];
        });
        it('should remove objective from both player if objective is public', () => {
            mathRandomStub.returns(0);
            objectivesHandler.attributeObjectives(player1, player2);
            objectivesHandler['completeObjective'](player1, ObjectivesInfo.oneVowelWord);
            expect(player1.objectives.length && player2.objectives.length).to.be.equal(2);
        });

        it('should remove objective to only player passed as parameter if objective if private', () => {
            mathRandomStub.returns(0);
            objectivesHandler.attributeObjectives(player1, player2);
            objectivesHandler['completeObjective'](player1, ObjectivesInfo.alphabeticalWord);
            expect(player1.objectives.length).to.be.equal(2);
            expect(player2.objectives.length).to.be.equal(3);
        });
    });

    context('verifyWordObjectives() Tests', () => {
        beforeEach(() => {
            player1.objectives = [];
            player2.objectives = [];
        });
        it('should call completeObjective() 1 time if player formed palindromic word', () => {
            const palindromicWord = {} as Word;
            palindromicWord.stringFormat = 'laval';
            const words: Word[] = [wordStub1, wordStub2, palindromicWord];
            objectivesHandler.verifyWordObjectives(ObjectivesInfo.palindromicWord, words, player1);
            expect(spyCompleteObjectives.calledOnceWith(player1, ObjectivesInfo.palindromicWord)).to.be.equal(true);
        });

        it('should not call completeObjective() if there is no palindromic word in list', () => {
            const words: Word[] = [wordStub1];
            objectivesHandler.verifyWordObjectives(ObjectivesInfo.palindromicWord, words, player1);
            expect(spyCompleteObjectives.called).to.be.equal(false);
        });
    });

    context('verifyTurnObjectives() Tests', () => {
        it('should call completeObjective() 1 time if player has placed 5 letters twice in a row', () => {
            player1.fiveLettersPlacedCount = 1;
            const numberOfPlacedLetters = 5;
            objectivesHandler.verifyTurnObjectives(ObjectivesInfo.fiveLettersPlacedTwice, numberOfPlacedLetters, player1);
            expect(spyCompleteObjectives.calledOnceWith(player1, ObjectivesInfo.fiveLettersPlacedTwice)).to.be.equal(true);
        });

        it('should not call completeObjective() if player did not place 5 letters twice in a row', () => {
            player1.fiveLettersPlacedCount = 0;
            const numberOfPlacedLetters = 5;
            objectivesHandler.verifyTurnObjectives(ObjectivesInfo.fiveLettersPlacedTwice, numberOfPlacedLetters, player1);
            expect(spyCompleteObjectives.called).to.be.equal(false);
        });
    });

    context('verifyObjectives() Tests', () => {
        let spyWordRelatedObjective: Sinon.SinonSpy;
        let spyTurnRelatedObjective: Sinon.SinonSpy;
        beforeEach(() => {
            spyWordRelatedObjective = Sinon.spy(objectivesHandler, 'verifyWordObjectives');
            spyTurnRelatedObjective = Sinon.spy(objectivesHandler, 'verifyTurnObjectives');
        });

        it('should call verify word objectives 2 times and turn objectives 1 time if player has them', () => {
            const words: Word[] = [wordStub1, wordStub2, wordStub3];
            player1.objectives = [ObjectivesInfo.palindromicWord, ObjectivesInfo.oneVowelWord, ObjectivesInfo.fiveLettersPlacedTwice];
            objectivesHandler.verifyObjectives(player1, words, 10);
            expect(spyWordRelatedObjective.callCount).to.be.equal(2);
            expect(spyTurnRelatedObjective.callCount).to.be.equal(1);
        });

        it('should not call verifyWordObjectives() and verifyTurnObjectives() if player does not have any of them', () => {
            const objectiveStub = {} as Objective;
            objectiveStub.type = 'otherType';
            const words: Word[] = [wordStub1, wordStub2, wordStub3];
            player1.objectives = [objectiveStub];
            objectivesHandler.verifyObjectives(player1, words, 10);
            expect(spyWordRelatedObjective.callCount && spyTurnRelatedObjective).to.be.equal(0);
        });
    });

    context('verifyClueCommandEndGame() Tests', () => {
        it('should return if the game mode is not 2990', () => {
            player1.game.isMode2990 = false;
            player2.game.isMode2990 = false;
            player1.score = 0;
            player2.score = 0;
            player1.clueCommandUseCount = 0;
            player2.clueCommandUseCount = 10;
            player1.objectives.push(ObjectivesInfo.clueCommandNeverUsed);
            player2.objectives.push(ObjectivesInfo.clueCommandNeverUsed);
            objectivesHandler.verifyClueCommandEndGame(objectivesHandler.players);
            expect(player1.score).to.be.equal(0);
            expect(player2.score).to.be.equal(0);
        });

        it('should give 45 points to player 1 if he never used clue command and not to player 2 if both players have the objective', () => {
            player1.score = 0;
            player2.score = 0;
            player1.clueCommandUseCount = 0;
            player2.clueCommandUseCount = 10;
            player1.objectives.push(ObjectivesInfo.clueCommandNeverUsed);
            player2.objectives.push(ObjectivesInfo.clueCommandNeverUsed);
            objectivesHandler.verifyClueCommandEndGame(objectivesHandler.players);
            expect(player1.score).to.be.equal(45);
            expect(player2.score).to.be.equal(0);
        });

        it('should not give 45 points to players if they never used clue command but dont have the objective', () => {
            player1.score = 0;
            player2.score = 0;
            player1.clueCommandUseCount = 0;
            player2.clueCommandUseCount = 0;
            player1.objectives = [];
            player2.objectives = [];
            objectivesHandler.verifyClueCommandEndGame(objectivesHandler.players);
            expect(player1.score).to.be.equal(0);
            expect(player2.score).to.be.equal(0);
        });

        it('should instantly return if game mode is not LOG2990', () => {
            player1.game.isMode2990 = false;
            objectivesHandler.verifyClueCommandEndGame(objectivesHandler.players);
            expect(socketManagerStub.emitRoom.called).to.be.equal(false);
        });
    });
});
