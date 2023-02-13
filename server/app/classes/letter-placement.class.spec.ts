/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable dot-notation */
import { Game } from '@app/classes/game.class';
import { Gameboard } from '@app/classes/gameboard.class';
import { ObjectivesHandler } from '@app/classes/objectives-handler.class';
import { Player } from '@app/classes/player/player.class';
import { Word } from '@app/classes/word.class';
import { RackService } from '@app/services/rack.service';
import { CommandInfo } from '@common/interfaces/command-info';
import { expect } from 'chai';
import * as Sinon from 'sinon';
import { Container } from 'typedi';
import { DictionaryValidation } from './dictionary-validation.class';
import { LetterPlacement } from './letter-placement.class';

describe('Letter Placement', () => {
    let player: Player;
    let commandInfo: CommandInfo;
    let gameboard: Gameboard;
    let rackService: RackService;
    let dictionaryValidation: Sinon.SinonStubbedInstance<DictionaryValidation> & DictionaryValidation;
    let placement: LetterPlacement;
    let word: Word;

    beforeEach(() => {
        player = new Player('test');
        player.rack = [
            { value: 'a', quantity: 1, points: 1 },
            { value: 'b', quantity: 1, points: 1 },
        ];
        player.score = 0;
        player.room = 'testRoom';
        player.game = Sinon.createStubInstance(Game) as Game & Sinon.SinonStubbedInstance<Game>;
        player.game.objectivesHandler = Sinon.createStubInstance(ObjectivesHandler) as ObjectivesHandler &
            Sinon.SinonStubbedInstance<ObjectivesHandler>;
        commandInfo = {
            firstCoordinate: { x: 1, y: 1 },
            isHorizontal: true,
            letters: ['a', 'l', 'l'],
        };

        gameboard = new Gameboard();
        rackService = Container.get(RackService);
        dictionaryValidation = Sinon.createStubInstance(DictionaryValidation) as Sinon.SinonStubbedInstance<DictionaryValidation> &
            DictionaryValidation;
        placement = new LetterPlacement(dictionaryValidation, rackService);
    });

    context('validateCommandCoordinate() tests', () => {
        it('validateCommandCoordinate() should return true if coord is valid and position is not Occupied', () => {
            expect(placement['validateCommandCoordinate']({ x: 1, y: 1 }, gameboard)).to.equal(true);
        });

        it('validateCommandCoordinate() should return false if coord is outOfBounds and position is not Occupied', () => {
            expect(placement['validateCommandCoordinate']({ x: 0, y: 1 }, gameboard)).to.equal(false);
        });

        it('validateCommandCoordinate() should return false if coord is outOfBounds and position is not Occupied', () => {
            expect(placement['validateCommandCoordinate']({ x: 1, y: 0 }, gameboard)).to.equal(false);
        });

        it('validateCommandCoordinate() should return false if coord is outOfBounds and position is not Occupied', () => {
            expect(placement['validateCommandCoordinate']({ x: 0, y: 0 }, gameboard)).to.equal(false);
        });

        it('validateCommandCoordinate() should return false if coord already isOccupied on board', () => {
            gameboard.placeLetter({ x: 1, y: 1 }, 'a');
            expect(placement['validateCommandCoordinate']({ x: 1, y: 1 }, gameboard)).to.equal(false);
        });
    });

    context('upDownLeftOrRightAreOccupied tests', () => {
        it('upDownLeftOrRightAreOccupied() should return true if up, down, left and right are ALL in board limits and isOccupied true', () => {
            gameboard.placeLetter({ x: 2, y: 1 }, 'a');
            gameboard.placeLetter({ x: 2, y: 3 }, 'a');
            gameboard.placeLetter({ x: 1, y: 2 }, 'a');
            gameboard.placeLetter({ x: 3, y: 2 }, 'a');
            expect(placement['upDownLeftOrRightAreOccupied']({ x: 2, y: 2 }, gameboard)).to.equal(true);
        });

        it('upDownLeftOrRightAreOccupied() should return false if left or up in not in board limits and isOccupied false', () => {
            expect(placement['upDownLeftOrRightAreOccupied']({ x: 1, y: 1 }, gameboard)).to.equal(false);
        });

        it('upDownLeftOrRightAreOccupied() should return true if ONLY down in board limits and isOccupied true', () => {
            gameboard.placeLetter({ x: 2, y: 3 }, 'a');
            expect(placement['upDownLeftOrRightAreOccupied']({ x: 2, y: 2 }, gameboard)).to.equal(true);
        });

        it('upDownLeftOrRightAreOccupied() should return true if ONLY left in board limits and isOccupied true', () => {
            gameboard.placeLetter({ x: 1, y: 2 }, 'a');
            expect(placement['upDownLeftOrRightAreOccupied']({ x: 2, y: 2 }, gameboard)).to.equal(true);
        });

        it('upDownLeftOrRightAreOccupied() should return true if ONLY right in board limits and isOccupied true', () => {
            gameboard.placeLetter({ x: 3, y: 2 }, 'a');
            expect(placement['upDownLeftOrRightAreOccupied']({ x: 2, y: 2 }, gameboard)).to.equal(true);
        });
    });

    context('wordIsPlacedCorrectly() tests', () => {
        beforeEach(() => {
            word = new Word(
                {
                    firstCoordinate: { x: 1, y: 1 },
                    isHorizontal: true,
                    letters: ['a', 'b'],
                },
                gameboard,
            );
        });

        it('wordIsPlacedCorrectly() should call verifyFirstTurn() if isFirstTurn() returns true', () => {
            const lettersInRackStub = Sinon.stub(placement, 'isFirstTurn' as never);
            lettersInRackStub.returns(true);
            const verifyFirstTurnStub = Sinon.stub(placement, 'verifyFirstTurn' as never);

            placement['wordIsPlacedCorrectly'](word.newLetterCoords, gameboard);
            expect(verifyFirstTurnStub.calledOnce).to.equal(true);
        });

        it('wordIsPlacedCorrectly() should call isWordIsAttachedToBoardLetter() if isFirstTurn() returns false', () => {
            const lettersInRackStub = Sinon.stub(placement, 'isFirstTurn' as never);
            lettersInRackStub.returns(false);
            const isWordIsAttachedToBoardLetterStub = Sinon.stub(placement, 'isWordIsAttachedToBoardLetter' as never);

            placement['wordIsPlacedCorrectly'](word.newLetterCoords, gameboard);
            expect(isWordIsAttachedToBoardLetterStub.calledOnce).to.equal(true);
        });

        it('isFirstTurn() should return true if gameboard is empty', () => {
            expect(placement['isFirstTurn'](gameboard)).to.equal(true);
        });

        it('isFirstTurn() should return false if gameboard is not empty', () => {
            gameboard.placeLetter({ x: 1, y: 1 }, 'a');
            expect(placement['isFirstTurn'](gameboard)).to.equal(false);
        });
    });

    context('isWordIsAttachedToBoardLetter() tests ', () => {
        it('isWordIsAttachedToBoardLetter() should return false if gameboard is empty', () => {
            const upDownLeftOrRightAreOccupiedStub = Sinon.stub(placement, 'upDownLeftOrRightAreOccupied' as never);
            upDownLeftOrRightAreOccupiedStub.returns(false);
            expect(
                placement['isWordIsAttachedToBoardLetter'](
                    [
                        { x: 1, y: 1 },
                        { x: 2, y: 1 },
                    ],
                    gameboard,
                ),
            ).to.equal(false);
        });

        it('isWordIsAttachedToBoardLetter() should return true if gameboard contains letter next to word', () => {
            const upDownLeftOrRightAreOccupied = Sinon.stub(placement, 'upDownLeftOrRightAreOccupied' as never);
            upDownLeftOrRightAreOccupied.returns(true);
            gameboard.placeLetter({ x: 1, y: 2 }, 'a');
            expect(
                placement['isWordIsAttachedToBoardLetter'](
                    [
                        { x: 1, y: 1 },
                        { x: 2, y: 1 },
                    ],
                    gameboard,
                ),
            ).to.equal(true);
        });
    });

    context('verifyFirstTurn() tests', () => {
        it('should return true if gameboard has no placed letters and letterCoords include middle coordinate', () => {
            word = new Word(
                {
                    firstCoordinate: { x: 8, y: 8 },
                    isHorizontal: true,
                    letters: ['a', 'b'],
                },
                gameboard,
            );
            const allUnoccupied = gameboard.gameboardTiles.every((tile) => tile.isOccupied === false);
            expect(allUnoccupied).to.equal(true);
            expect(placement['verifyFirstTurn'](word.wordCoords)).to.equal(true);
        });

        it('should return true if gameboard has no placed letters and letterCoords do not include middle coordinate', () => {
            word = new Word(
                {
                    firstCoordinate: { x: 1, y: 1 },
                    isHorizontal: true,
                    letters: ['a', 'b'],
                },
                gameboard,
            );
            const allUnoccupied = gameboard.gameboardTiles.every((tile) => tile.isOccupied === false);
            expect(allUnoccupied).to.equal(true);
            expect(placement['verifyFirstTurn'](word.wordCoords)).to.equal(false);
        });

        it('should return true if gameboard has no placed letters and letterCoords includes middle coordinate', () => {
            const allEqual = gameboard.gameboardTiles.every((tile) => tile.isOccupied === false);
            expect(allEqual).to.equal(true);
            expect(
                placement['verifyFirstTurn']([
                    { x: 8, y: 8 },
                    { x: 8, y: 9 },
                ]),
            ).to.equal(true);
        });

        it('should return true if there is placed letters on the gameboard', () => {
            gameboard.placeLetter({ x: 1, y: 1 }, 'a');
            expect(
                placement['verifyFirstTurn']([
                    { x: 8, y: 8 },
                    { x: 8, y: 9 },
                ]),
            ).to.equal(true);
        });
    });

    context('globalCommandVerification() tests', () => {
        let validateCommandCoordinateStub: Sinon.SinonStub<unknown[], unknown>;
        let lettersInRackStub: Sinon.SinonStub<unknown[], unknown>;
        let wordIsPlacedCorrectlyStub: Sinon.SinonStub<unknown[], unknown>;
        beforeEach(() => {
            validateCommandCoordinateStub = Sinon.stub(placement, 'validateCommandCoordinate' as never);
            lettersInRackStub = Sinon.stub(rackService, 'areLettersInRack');
            wordIsPlacedCorrectlyStub = Sinon.stub(placement, 'wordIsPlacedCorrectly' as never);
        });

        afterEach(() => {
            validateCommandCoordinateStub.restore();
            lettersInRackStub.restore();
            wordIsPlacedCorrectlyStub.restore();
        });

        it('should return array with empty Word object and commandCoordinateOutOfBounds string if validateCommandCoordinate() returns false', () => {
            validateCommandCoordinateStub.withArgs(commandInfo, gameboard).returns(false);
            const expectedReturn = [{}, 'Placement invalide pour la premiere coordonnée'];
            expect(placement.globalCommandVerification(commandInfo, gameboard, player)).to.eql(expectedReturn);
        });

        it('should return array with empty Word object and lettersNotInRack string if areLettersInRack() returns false', () => {
            validateCommandCoordinateStub.returns(true);
            lettersInRackStub.returns(false);
            const expectedReturn = [{}, 'Les lettres ne sont pas dans le chavalet'];
            expect(placement.globalCommandVerification(commandInfo, gameboard, player)).to.eql(expectedReturn);
        });

        it('should return array with empty Word object and invalidFirstWordPlacement string if wordIsPlacedCorrectly() returns false', () => {
            validateCommandCoordinateStub.returns(true);
            lettersInRackStub.returns(true);
            wordIsPlacedCorrectlyStub.returns(false);
            const expectedReturn = [{}, "Le mot doit être attaché à un autre mot (ou passer par la case du milieu si c'est le premier tour)"];
            expect(placement.globalCommandVerification(commandInfo, gameboard, player)).to.eql(expectedReturn);
        });

        it('should return array with empty Word object and invalidWordBuild if newly word created is out of bounce', () => {
            validateCommandCoordinateStub.returns(true);
            lettersInRackStub.returns(true);
            const commandInfoOutOfBounce = {
                firstCoordinate: { x: 15, y: 1 },
                isHorizontal: true,
                letters: ['a', 'l', 'l'],
            };
            const expectedReturn = [{}, "Le mot ne possède qu'une lettre OU les lettres en commande sortent du plateau"];
            expect(placement.globalCommandVerification(commandInfoOutOfBounce, gameboard, player)).to.eql(expectedReturn);
        });

        it('should return array with empty Word object and invalidWordBuild if newly word created has only one letter', () => {
            validateCommandCoordinateStub.returns(true);
            lettersInRackStub.returns(true);
            const commandInfoOneLetter = {
                firstCoordinate: { x: 1, y: 1 },
                isHorizontal: true,
                letters: ['a'],
            };
            const expectedReturn = [{}, "Le mot ne possède qu'une lettre OU les lettres en commande sortent du plateau"];
            expect(placement.globalCommandVerification(commandInfoOneLetter, gameboard, player)).to.eql(expectedReturn);
        });

        it('should return array with Word object and null if verification is valid', () => {
            validateCommandCoordinateStub.returns(true);
            lettersInRackStub.returns(true);
            wordIsPlacedCorrectlyStub.returns(true);
            const expectedWord = {
                isValid: true,
                isHorizontal: true,
                stringFormat: 'all',
                points: 0,
                newLetterCoords: [
                    { x: 1, y: 1 },
                    { x: 2, y: 1 },
                    { x: 3, y: 1 },
                ],
                wordCoords: [
                    { x: 1, y: 1 },
                    { x: 2, y: 1 },
                    { x: 3, y: 1 },
                ],
            };
            const expectedReturn = [expectedWord, null];
            expect(placement.globalCommandVerification(commandInfo, gameboard, player)).to.eql(expectedReturn);
        });
    });

    context('placeLetters tests', () => {
        let dictionaryValidationStub: Sinon.SinonStubbedInstance<DictionaryValidation>;
        beforeEach(() => {
            word = {
                isValid: true,
                isHorizontal: true,
                stringFormat: 'all',
                points: 0,
                newLetterCoords: [
                    { x: 1, y: 1 },
                    { x: 2, y: 1 },
                    { x: 3, y: 1 },
                ],
                wordCoords: [
                    { x: 1, y: 1 },
                    { x: 2, y: 1 },
                    { x: 3, y: 1 },
                ],
            } as unknown as Word;
            dictionaryValidationStub = placement['dictionaryValidation'] as unknown as Sinon.SinonStubbedInstance<DictionaryValidation>;
        });

        it('should call validateWord() once', () => {
            dictionaryValidationStub.validateWord.returns({
                points: 0,
                invalidWords: [] as Word[],
            });
            commandInfo = {
                firstCoordinate: { x: 1, y: 1 },
                isHorizontal: true,
                letters: ['a', 'l', 'L'],
            };
            placement.placeLetters(word, commandInfo, player, gameboard);
            expect(dictionaryValidationStub.validateWord.calledOnce).to.equal(true);
        });

        it('should return false and the gameboard if validateWord returns 0', () => {
            const validateWordReturn = {
                points: 0,
                invalidWords: [
                    {
                        isValid: false,
                        isHorizontal: true,
                        stringFormat: 'a',
                        points: 0,
                        newLetterCoords: [{ x: 1, y: 1 }],
                        wordCoords: [{ x: 1, y: 1 }],
                    } as unknown as Word,
                ] as Word[],
            };
            dictionaryValidationStub.validateWord.returns(validateWordReturn);

            const expected = { hasPassed: false, gameboard, invalidWords: validateWordReturn.invalidWords };
            expect(placement.placeLetters(word, commandInfo, player, gameboard)).to.eql(expected);
        });

        it('should change player score if validateWord() doesnt return 0', () => {
            player.game.isMode2990 = true;
            const validateWordReturn = {
                points: 10,
                invalidWords: [] as Word[],
            };
            dictionaryValidationStub.validateWord.returns(validateWordReturn);
            placement.placeLetters(word, commandInfo, player, gameboard);
            expect(player.score).to.equal(validateWordReturn.points);
        });

        it('should return true and gameboard if validateWord() doesnt return 0', () => {
            dictionaryValidationStub.validateWord.returns({ points: 10, invalidWords: [] as Word[] });
            const expected = { hasPassed: true, gameboard, invalidWords: [] };
            expect(placement.placeLetters(word, commandInfo, player, gameboard)).to.eql(expected);
        });
    });
});
