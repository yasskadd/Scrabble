/* eslint-disable dot-notation */
import { Gameboard } from '@app/classes/gameboard.class';
import { CommandInfo } from '@common/interfaces/command-info';
import { Coordinate } from '@common/interfaces/coordinate';
import { expect } from 'chai';
import * as Sinon from 'sinon';
import { DictionaryValidation } from './dictionary-validation.class';
import { WordSolver } from './word-solver.class';

describe('Word solver', () => {
    let wordSolver: WordSolver;
    let dictionaryValidation: DictionaryValidation;
    let gameboard: Gameboard;
    let spyFindBeforePart: Sinon.SinonSpy;

    before(() => {
        dictionaryValidation = new DictionaryValidation(['string', 'avion', 'peur', 'eau', 'le']);
        dictionaryValidation.createTrieDictionary();
    });

    beforeEach(() => {
        wordSolver = new WordSolver(dictionaryValidation);
        gameboard = new Gameboard();
        wordSolver['gameboard'] = gameboard;
        spyFindBeforePart = Sinon.spy(wordSolver, 'findWordPartBeforeAnchor' as keyof WordSolver);
    });

    it('findAllOptions should not call extendWordAfterAnchor() if partialWordNode is null', () => {
        const rack: string[] = ['l'];
        const spyExtendAfter = Sinon.spy(wordSolver, 'extendWordAfterAnchor' as never);
        const stubPartialWordNode = Sinon.stub(wordSolver, 'buildPartialWord' as never);
        stubPartialWordNode.returns('notInTrie');
        gameboard.placeLetter({ x: 8, y: 8 } as Coordinate, 'e');
        wordSolver.findAllOptions(rack);
        expect(spyExtendAfter.calledWith('notInTrie')).to.be.equal(false);
    });

    it('setGameboard should set the gameboard attribute of the service', () => {
        const gameboardStub = new Gameboard();
        gameboardStub.placeLetter({ x: 1, y: 12 }, 'z');
        gameboardStub.placeLetter({ x: 2, y: 1 }, 'x');
        gameboardStub.placeLetter({ x: 2, y: 1 }, 'l');
        gameboardStub.placeLetter({ x: 7, y: 10 }, 'a');
        wordSolver.setGameboard(gameboardStub);
        expect(wordSolver['gameboard']).to.equal(gameboardStub);
    });

    context('Coordinate manipulation tests', () => {
        let upLeftCoordinate: Coordinate;
        let downRightCoordinate: Coordinate;
        let centerCoordinate: Coordinate;
        beforeEach(() => {
            upLeftCoordinate = { x: 1, y: 1 };
            downRightCoordinate = { x: 15, y: 15 };
            centerCoordinate = { x: 8, y: 8 };
        });

        it('incrementCoord should return a new Coordinate with x incremented if isHorizontal is true', () => {
            const newCoordinate = wordSolver['incrementCoord'](centerCoordinate, true);
            expect(newCoordinate).to.eql({ x: 9, y: 8 });
        });

        it('incrementCoord should return a new Coordinate with y incremented if isHorizontal is false', () => {
            const newCoordinate = wordSolver['incrementCoord'](centerCoordinate, false);
            expect(newCoordinate).to.eql({ x: 8, y: 9 });
        });

        it('incrementCoord should return null if the coordinate passed as an argument is on the edge of the board vertically or horizontally', () => {
            const newCoordinateHorizontal = wordSolver['incrementCoord'](downRightCoordinate, true);
            const newCoordinateVertical = wordSolver['incrementCoord'](downRightCoordinate, false);
            expect(newCoordinateHorizontal && newCoordinateVertical).to.eql(null);
        });

        it('decrementCoord should return a newCoordinate with x decremented if isHorizontal is true', () => {
            const newCoordinate = wordSolver['decrementCoord'](centerCoordinate, true);
            expect(newCoordinate).to.eql({ x: 7, y: 8 });
        });

        it('decrementCoord should return a newCoordinate with y decremented if isHorizontal is false', () => {
            const newCoordinate = wordSolver['decrementCoord'](centerCoordinate, false);
            expect(newCoordinate).to.eql({ x: 8, y: 7 });
        });

        it('decrementCoord should return null if the coordinate passed as an argument is on the edge of the board vertically or horizontally', () => {
            const newCoordinateHorizontal = wordSolver['decrementCoord'](upLeftCoordinate, true);
            const newCoordinateVertical = wordSolver['decrementCoord'](upLeftCoordinate, false);
            expect(newCoordinateHorizontal && newCoordinateVertical).to.eql(null);
        });
    });

    context('buildPartialWord() Tests', () => {
        beforeEach(() => {
            gameboard.placeLetter({ x: 8, y: 8 }, 's');
        });

        it('should return empty string if coordinate passed as an argument is not occupied and isHorizontal is true or false', () => {
            wordSolver['isHorizontal'] = true;
            const result1 = wordSolver['buildPartialWord']({ x: 7, y: 7 });

            wordSolver['isVertical'] = false;
            const result2 = wordSolver['buildPartialWord']({ x: 7, y: 7 });

            expect(result1 && result2).to.eql('');
        });

        it('should return single string if coordinate passed as an argument is occupied and there is no adjacent letter', () => {
            wordSolver['isHorizontal'] = true;
            const result1 = wordSolver['buildPartialWord']({ x: 8, y: 8 });

            wordSolver['isHorizontal'] = false;
            const result2 = wordSolver['buildPartialWord']({ x: 8, y: 8 });

            expect(result1 && result2).to.eql('s');
        });

        it('should return correct string if there is adjacent letters horizontally', () => {
            gameboard.placeLetter({ x: 7, y: 8 }, 'e');
            gameboard.placeLetter({ x: 6, y: 8 }, 'l');
            wordSolver['isHorizontal'] = true;
            const result = wordSolver['buildPartialWord']({ x: 8, y: 8 });

            expect(result).to.eql('les');
        });

        it('should return correct string if there is adjacent letters vertically', () => {
            gameboard.placeLetter({ x: 8, y: 7 }, 'e');
            gameboard.placeLetter({ x: 8, y: 6 }, 'l');
            wordSolver['isHorizontal'] = false;
            const result = wordSolver['buildPartialWord']({ x: 8, y: 8 });

            expect(result).to.eql('les');
        });
    });

    context('getLimitNumber() Tests', () => {
        let anchorsList: Coordinate[];
        const NUMBER_5 = 5;
        beforeEach(() => {
            gameboard.placeLetter({ x: 5, y: 5 }, '');
            anchorsList = gameboard.findAnchors();
        });

        it('should return 0 if coordinate passed as an argument is occupied', () => {
            expect(wordSolver['getLimitNumber']({ x: 5, y: 5 }, anchorsList)).to.equal(0);
        });

        it('should return 0 if coordinate passed as an argument is an anchor', () => {
            expect(wordSolver['getLimitNumber']({ x: 5, y: 6 }, anchorsList)).to.equal(0);
        });

        it('should return correct number if there is no anchors or occupied tiles on the way and isHorizontal is true', () => {
            const expected = 8;
            wordSolver['isHorizontal'] = true;
            expect(wordSolver['getLimitNumber']({ x: 8, y: 1 }, anchorsList)).to.equal(expected);
        });

        it('should return correct number if there is no anchors or occupied tiles on the way and isHorizontal is false', () => {
            wordSolver['isHorizontal'] = false;
            expect(wordSolver['getLimitNumber']({ x: 8, y: 3 }, anchorsList)).to.equal(3);
        });

        it('should return correct number if there is an anchor on the way and isHorizontal is true', () => {
            wordSolver['isHorizontal'] = true;
            expect(wordSolver['getLimitNumber']({ x: 8, y: 4 }, anchorsList)).to.equal(3);
        });

        it('should return correct number if there is an anchor on the way and isHorizontal is false', () => {
            wordSolver['isHorizontal'] = false;
            expect(wordSolver['getLimitNumber']({ x: 5, y: 11 }, anchorsList)).to.equal(NUMBER_5);
        });
    });

    context('findLettersForBoardTiles() Tests', () => {
        let result: Map<Coordinate, string[]>;
        beforeEach(() => {
            gameboard.placeLetter({ x: 1, y: 1 }, 'a');
            gameboard.placeLetter({ x: 3, y: 1 }, 'i');
            gameboard.placeLetter({ x: 4, y: 1 }, 'o');
            gameboard.placeLetter({ x: 5, y: 1 }, 'n');
        });

        it('result map should return correct list including letter v at (2, 1) position if isHorizontal is false', () => {
            wordSolver['isHorizontal'] = false;
            result = wordSolver['findLettersForBoardTiles']();
            expect(result.get(gameboard.getLetterTile({ x: 2, y: 1 }).coordinate)).to.contain('v');
            expect(result.get(gameboard.getLetterTile({ x: 2, y: 1 }).coordinate)).to.not.contain('a');
        });

        it('result should return a list containing all alphabet letters at (2, 1) position if isHorizontal is true', () => {
            wordSolver['isHorizontal'] = true;
            result = wordSolver['findLettersForBoardTiles']();
            expect(result.get(gameboard.getLetterTile({ x: 2, y: 1 }).coordinate)).to.eql('abcdefghijklmnopqrstuvwxyz'.split(''));
        });

        it('result should return undefined at an occupied tile', () => {
            expect(result.get(gameboard.getLetterTile({ x: 5, y: 1 }).coordinate)).to.equal(undefined);
        });
    });

    context('isOutOfBoundsOrIsOccupied() tests', () => {
        it('should return true if the coordinate is out of bounds horizontally', () => {
            const outOfBoundsCoord: Coordinate = { x: 17, y: 1 };
            expect(wordSolver['isOutOfBoundsOrIsOccupied'](outOfBoundsCoord)).to.equal(true);
        });

        it('should return true if the coordinate is out of bounds horizontally', () => {
            const outOfBoundsCoord: Coordinate = { x: 1, y: 17 };
            expect(wordSolver['isOutOfBoundsOrIsOccupied'](outOfBoundsCoord)).to.equal(true);
        });

        it('should return false if coordinate is placed on the gameboard', () => {
            gameboard.placeLetter({ x: 1, y: 1 }, '');
            expect(wordSolver['isOutOfBoundsOrIsOccupied']({ x: 1, y: 1 })).to.equal(false);
        });

        it('should return true if coordinate is not placed on the gameboard', () => {
            expect(wordSolver['isOutOfBoundsOrIsOccupied']({ x: 1, y: 1 })).to.equal(true);
        });
    });

    context('extendWordAfterAnchor() tests', () => {
        let spyCreateCommand: Sinon.SinonSpy<[rack: string[]]>;

        beforeEach(() => {
            wordSolver['rack'] = ['p', 'e', 'u', 'r'];
            wordSolver['isHorizontal'] = true;
            wordSolver['legalLetterForBoardTiles'] = wordSolver['findLettersForBoardTiles']();
            spyCreateCommand = Sinon.spy(wordSolver, 'createCommandInfo' as keyof WordSolver);
        });

        it('createCommandInfo should be called if we could form a word with the rack letters', () => {
            const nextPosition: Coordinate = { x: 2, y: 2 };
            wordSolver['extendWordAfterAnchor']('', wordSolver['trie'].root, nextPosition, false);
            expect(spyCreateCommand.called).to.equal(true);
        });

        it('createCommandInfo should be called if we could form a word with rack and placed letters on the board', () => {
            const nextPosition: Coordinate = { x: 2, y: 2 };
            gameboard.placeLetter({ x: 3, y: 2 }, 'a');
            wordSolver['extendWordAfterAnchor']('', wordSolver['trie'].root, nextPosition, false);
            expect(spyCreateCommand.called).to.equal(true);
        });

        it('createCommandInfo should be called if we could form a word with blank letter and letters on the board', () => {
            wordSolver['rack'] = ['*'];
            const nextPosition: Coordinate = { x: 2, y: 2 };
            gameboard.placeLetter({ x: 2, y: 2 }, 'l');
            wordSolver['extendWordAfterAnchor']('', wordSolver['trie'].root, nextPosition, false);
            expect(spyCreateCommand.called).to.equal(true);
        });

        it('should not call addRackLetterToPartialWord() or addBoardLetterToPartialWord() if nextPosition is null', () => {
            const spyAddRackLetterToWord = Sinon.spy(wordSolver, 'addRackLetterToPartialWord' as never);
            const spyBoardLetterToWord = Sinon.spy(wordSolver, 'addBoardLetterToPartialWord' as never);
            wordSolver['extendWordAfterAnchor']('', wordSolver['trie'].root, null as never, false);
            expect(spyAddRackLetterToWord.called && spyBoardLetterToWord.called).to.be.equal(false);
        });
    });

    it('should find all options', () => {
        const rack: string[] = ['*'];
        gameboard.placeLetter({ x: 1, y: 1 }, 's');
        gameboard.placeLetter({ x: 2, y: 1 }, 't');
        gameboard.placeLetter({ x: 3, y: 1 }, 'r');
        gameboard.placeLetter({ x: 4, y: 1 }, 'i');
        gameboard.placeLetter({ x: 5, y: 1 }, 'n');
        wordSolver.findAllOptions(rack);
        expect(wordSolver.commandInfoScore(wordSolver['commandInfoList']).size).to.be.greaterThan(0);
    });

    context('findWordPartBeforeAnchor() tests', () => {
        it('should call findWordPartBeforeAnchor() and extendWordAfterAnchor() more than once if a word could be found', () => {
            wordSolver['rack'] = ['l', 'e', '*'];
            const anchor: Coordinate = { x: 1, y: 1 };
            const limit = 100;
            const spyExtendWordAfterAnchor = Sinon.spy(wordSolver, 'extendWordAfterAnchor' as keyof WordSolver);
            wordSolver['findWordPartBeforeAnchor']('', wordSolver['trie'].root, anchor, limit);
            expect(spyFindBeforePart.callCount && spyExtendWordAfterAnchor.callCount).to.be.greaterThan(1);
        });
    });

    context('rackHasBlankLetter() tests', () => {
        it('should true if player rack has blank letter', () => {
            wordSolver['rack'] = ['l', 'e', 's', '*'];
            expect(wordSolver['rackHasBlankLetter']()).to.be.equal(true);
        });

        it('should false if player rack does not have blank letter', () => {
            wordSolver['rack'] = ['l', 'e', 's'];
            expect(wordSolver['rackHasBlankLetter']()).to.be.equal(false);
        });
    });

    it('createCommandInfo() should create correct commandInfo if there is placed letters on the board', () => {
        gameboard.placeLetter({ x: 2, y: 1 }, 'e');
        wordSolver['isHorizontal'] = true;
        const expectedCommandInfo: CommandInfo = {
            firstCoordinate: { x: 1, y: 1 },
            isHorizontal: true,
            letters: ['t', 's', 't'],
        };
        wordSolver['createCommandInfo']('test', { x: 4, y: 1 });

        expect(wordSolver['commandInfoList'][0]).to.deep.equal(expectedCommandInfo);
    });

    it('firstTurnOrEmpty() should not call findWordPartBeforeAnchor if there is placed letters on board', () => {
        wordSolver['rack'] = ['t', 'e', 's', 't'];
        wordSolver['gameboard'].placeLetter({ x: 1, y: 1 } as Coordinate, 'a');
        wordSolver['anchors'] = wordSolver['gameboard'].findAnchors();
        wordSolver['firstTurnOrEmpty']();
        expect(spyFindBeforePart.called).to.be.equal(false);
    });

    it('firstTurnOrEmpty() should call findWordPartBeforeAnchor if there is no placed letters on board', () => {
        wordSolver['anchors'] = wordSolver['gameboard'].findAnchors();
        const MAX_LETTERS_LIMIT = 7;
        wordSolver['rack'] = ['t', 'e', 's', 't'];
        wordSolver['firstTurnOrEmpty']();
        expect(spyFindBeforePart.firstCall.calledWith('', wordSolver['trie'].root, { x: 8, y: 8 } as Coordinate, MAX_LETTERS_LIMIT)).to.be.equal(
            true,
        );
    });

    context('CommandInfoScore() Tests', () => {
        it('should return an empty Map if commandInfoList passed as parameter is empty', () => {
            const mapResult: Map<CommandInfo, number> = wordSolver.commandInfoScore([]);
            expect(mapResult.size).to.be.equal(0);
        });

        it('should associate each commandInfo to points score in the map', () => {
            wordSolver['rack'] = ['a', 'l', 'l'];
            gameboard.placeLetter({ x: 8, y: 8 } as Coordinate, 'e');
            gameboard.placeLetter({ x: 5, y: 5 } as Coordinate, 'o');
            const mapResult: Map<CommandInfo, number> = wordSolver.commandInfoScore(wordSolver.findAllOptions(wordSolver['rack']));
            mapResult.forEach((value) => {
                expect(value).to.be.greaterThan(0);
            });
        });
    });
});
