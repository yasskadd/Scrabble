/* eslint-disable max-lines */
import { ElementRef } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { PlayerRackComponent } from '@app/components/player-rack/player-rack.component';
import * as constants from '@app/constants/board-view';
import { ChatboxHandlerService } from '@app/services/chatbox-handler.service';
import { GameClientService } from '@app/services/game-client.service';
import { GridService } from '@app/services/grid.service';
import { LetterPlacementService } from '@app/services/letter-placement.service';
import { of, Subject } from 'rxjs';

const LETTER_SIZE = 5;
class MockElementRef extends ElementRef {}

describe('PlayerRackComponent', () => {
    let component: PlayerRackComponent;
    let fixture: ComponentFixture<PlayerRackComponent>;
    let chatBoxHandlerSpy: jasmine.SpyObj<ChatboxHandlerService>;
    let gameClientServiceSpy: jasmine.SpyObj<GameClientService>;
    let gridServiceServiceSpy: jasmine.SpyObj<GridService>;
    let letterPlacementServiceSpy: jasmine.SpyObj<LetterPlacementService>;

    beforeEach(async () => {
        chatBoxHandlerSpy = jasmine.createSpyObj('ChatboxHandlerService', ['submitMessage']);
        gridServiceServiceSpy = jasmine.createSpyObj('GridService', [], { letterSize: LETTER_SIZE });
        letterPlacementServiceSpy = jasmine.createSpyObj('LetterPlacementService', ['submitPlacement', 'noLettersPlaced']);
        gameClientServiceSpy = jasmine.createSpyObj('GameClientService', ['updateGameboard'], {
            playerOneTurn: true,
            playerOne: {
                rack: [
                    {
                        value: 'a',
                        quantity: 2,
                        points: 1,
                    },

                    {
                        value: 'd',
                        quantity: 2,
                        points: 1,
                    },

                    {
                        value: 'a',
                        quantity: 2,
                        points: 1,
                    },

                    {
                        value: 'm',
                        quantity: 2,
                        points: 1,
                    },

                    {
                        value: 's',
                        quantity: 2,
                        points: 1,
                    },

                    {
                        value: 'o',
                        quantity: 2,
                        points: 1,
                    },

                    {
                        value: 'o',
                        quantity: 2,
                        points: 1,
                    },
                ],
            },
        });

        await TestBed.configureTestingModule({
            declarations: [PlayerRackComponent],
            providers: [
                { provide: ChatboxHandlerService, useValue: chatBoxHandlerSpy },
                { provide: GameClientService, useValue: gameClientServiceSpy },
                { provide: GridService, useValue: gridServiceServiceSpy },
                { provide: LetterPlacementService, useValue: letterPlacementServiceSpy },
                { provide: ElementRef, useClass: MockElementRef },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PlayerRackComponent);
        component = fixture.componentInstance;
        const typeEvent = new KeyboardEvent('keydown');
        component.keyboardParentSubject = of(typeEvent) as Subject<KeyboardEvent>;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call the method gameClientService.quitGame if leaveGame is called', () => {
        component.skipTurn();
        expect(chatBoxHandlerSpy.submitMessage).toHaveBeenCalled();
    });

    it('should call skipTurn when the button to skip is pressed and it is your turn to play', fakeAsync(() => {
        const spy = spyOn(component, 'skipTurn');
        const button = fixture.debugElement.nativeElement.querySelector('#skip-turn');
        button.click();
        tick();
        fixture.detectChanges();
        expect(spy).toHaveBeenCalled();
    }));

    it('clicking outside the rack should call clickOutside', () => {
        const indexLetter = 0;
        const spy = spyOn(component, 'clickOutside');
        const mockClick = new MouseEvent('oncontextmenu');
        component.onRightClick(mockClick, indexLetter);
        fixture.detectChanges();
        window.dispatchEvent(new MouseEvent('click'));
        fixture.detectChanges();
        expect(spy).toHaveBeenCalled();
    });

    it('selecting a letter for exchange that is selected for manipulation should change to be exchanged', () => {
        const expectedManipulate: number[] = [];
        const expectedExchange: number[] = [0, 2, 1];
        const indexLetter = 1;
        component.lettersToManipulate = [1];
        component.lettersToExchange = [0, 2];
        const mockClick = new MouseEvent('oncontextmenu');
        component.onRightClick(mockClick, indexLetter);
        fixture.detectChanges();
        expect(component.lettersToManipulate).toEqual(expectedManipulate);
        expect(component.lettersToExchange).toEqual(expectedExchange);
    });

    it('scrolling upwards in rack should reposition rack', () => {
        const spy = spyOn(component, 'repositionRack');
        const mockScroll = new WheelEvent('scroll');
        component.onScrollEvent(mockScroll);
        fixture.detectChanges();
        expect(spy).toHaveBeenCalled();
        expect(component.buttonPressed).toEqual('ArrowRight');
    });

    it('scrolling upwards in rack should call repositionRack and change buttonPressed value to ArrowLeft', () => {
        const spy = spyOn(component, 'repositionRack');
        const upwardScroll = -15;
        const leftKey = 'ArrowLeft';
        const mockScroll = new WheelEvent('scroll', { deltaY: upwardScroll, deltaMode: 0 });
        component.onScrollEvent(mockScroll);
        component.onScrollEvent(mockScroll);
        fixture.detectChanges();
        expect(spy).toHaveBeenCalled();
        expect(component.buttonPressed).toEqual(leftKey);
        expect(mockScroll.deltaY).toBeLessThan(0);
    });

    it('clicking outside the rack should deselect all selected letters', () => {
        const spy = spyOn(component, 'cancel');
        spyOn(fixture.debugElement.nativeElement, 'contains').and.callFake(() => {
            return false;
        });
        component.lettersToExchange = [0];
        const indexLetter = 0;
        const mockClick = new MouseEvent('oncontextmenu');
        component.onRightClick(mockClick, indexLetter);
        fixture.detectChanges();
        window.dispatchEvent(new MouseEvent('click'));
        fixture.detectChanges();
        expect(component.lettersToExchange.length).toEqual(0);
        expect(spy).toHaveBeenCalled();
    });

    it('onRightClick should select a letter and insert it into the lettersToExchange on right click', () => {
        const indexLetter = 0;
        const mockClick = new MouseEvent('oncontextmenu');
        component.onRightClick(mockClick, indexLetter);
        expect(component.lettersToExchange.length).toEqual(1);
        expect(component.lettersToExchange[0]).toEqual(0);
    });

    it('onRightClick should remove a letter from lettersToExchange on right click', () => {
        const indexLetter = 0;
        const mockClick = new MouseEvent('oncontextmenu');
        component.onRightClick(mockClick, indexLetter);
        component.onRightClick(mockClick, indexLetter);
        expect(component.lettersToExchange.length).toEqual(0);
    });

    it('onRightClick should select a letter and update the array in the html element', () => {
        const indexLetter = 0;
        const mockClick = new MouseEvent('oncontextmenu');
        component.onRightClick(mockClick, indexLetter);
        fixture.detectChanges();
        const lettersDiv = fixture.debugElement.nativeElement.querySelector('#player-letters').children;
        expect(lettersDiv[indexLetter].classList).toContain('rack-letter-exchange-selected');
    });

    it('onLeftClick should call cancel', () => {
        const indexLetter = 0;
        const mockClick = new MouseEvent('click');
        const spy = spyOn(component, 'cancel');
        component.onLeftClick(mockClick, indexLetter);
        fixture.detectChanges();
        expect(spy).toHaveBeenCalled();
        expect(!component.lettersToExchange.includes(indexLetter)).toBeTruthy();
    });

    it('onLeftClick should select letter to manipulate if it was selected for exchange', () => {
        const indexLetter = 1;
        const mockClick = new MouseEvent('click');
        const spy = spyOn(component, 'cancel');
        component.onRightClick(mockClick, indexLetter);
        fixture.detectChanges();
        component.onLeftClick(mockClick, indexLetter);
        fixture.detectChanges();
        expect(spy).toHaveBeenCalled();
        expect(component.lettersToManipulate.includes(indexLetter)).toBeTruthy();
    });

    it('onRightClick should deselect a letter already selected on right click ', () => {
        const indexLetter = 0;
        const mockClick = new MouseEvent('oncontextmenu');
        component.onRightClick(mockClick, indexLetter);
        component.onRightClick(mockClick, indexLetter);
        fixture.detectChanges();
        const lettersDiv = fixture.debugElement.nativeElement.querySelector('#player-letters').children;
        expect(component.lettersToExchange.length).toEqual(0);
        expect(lettersDiv[indexLetter].className).toEqual('rack-letter');
    });

    it('onRightClick should select a letter that was selected for manipulation', () => {
        const index = 3;
        component.lettersToManipulate = [index];
        expect(component.lettersToExchange.length).toEqual(0);
        const mockClick = new MouseEvent('oncontextmenu');
        component.onLeftClick(mockClick, index);
        component.onRightClick(mockClick, index);
        fixture.detectChanges();
        expect(component.lettersToManipulate.length).toEqual(0);
        expect(component.lettersToExchange.length).toEqual(1);
    });

    it('should call exchange when the button to exchange is pressed and it is your turn to play', fakeAsync(() => {
        const spy = spyOn(component, 'exchange');
        component.lettersToExchange = [0];
        fixture.detectChanges();
        const button = fixture.debugElement.nativeElement.querySelector('#exchange');
        button.click();
        tick();
        fixture.detectChanges();
        expect(spy).toHaveBeenCalled();
    }));

    it('should have a button to exchange letter when there is at least one letter selected', () => {
        component.lettersToExchange = [0, 2];
        fixture.detectChanges();
        const button = fixture.debugElement.nativeElement.querySelector('#exchange');
        expect(button).toBeTruthy();
    });

    it('should  not have a button to exchange letter when there is not at least one letter selected', () => {
        component.lettersToExchange = [];
        fixture.detectChanges();
        const button = fixture.debugElement.nativeElement.querySelector('#exchange');
        expect(button).toBeFalsy();
    });

    it('exchange should call submitMessage of chatBoxHandler with the letters to exchange as argument', () => {
        component.lettersToExchange = [0];
        component.exchange();
        expect(chatBoxHandlerSpy.submitMessage).toHaveBeenCalledWith('!échanger a');
    });

    it('exchange should call cancel', () => {
        const spy = spyOn(component, 'cancel');
        component.exchange();
        expect(spy).toHaveBeenCalled();
    });

    it('when right click is done twice on the same letter, lettersToExchange should be empty and letter should be deselected', () => {
        const index = 5;
        const mockClick = new MouseEvent('oncontextmenu');
        component.onRightClick(mockClick, index);
        component.onRightClick(mockClick, index);
        fixture.detectChanges();
        expect(component.lettersToExchange.length).toEqual(0);
    });

    it("letterSize should return a letter's size", () => {
        expect(component.letterSize).toEqual(LETTER_SIZE);
    });
    it("pointsSize should return a letter's size", () => {
        expect(component.pointsSize).toEqual(LETTER_SIZE * constants.LETTER_WEIGHT_RATIO);
    });

    it('should call cancel when the button to cancel selection is pressed', fakeAsync(() => {
        const spy = spyOn(component, 'cancel');
        component.lettersToExchange = [0];
        fixture.detectChanges();
        const button = fixture.debugElement.nativeElement.querySelector('#cancel');
        button.click();
        tick();
        fixture.detectChanges();
        expect(spy).toHaveBeenCalled();
    }));

    it('should have a button to cancel selection of letter to exchange when there is at least one letter selected', () => {
        component.lettersToExchange = [0, 2];
        fixture.detectChanges();
        const button = fixture.debugElement.nativeElement.querySelector('#cancel');
        expect(button).toBeTruthy();
    });

    it('should not have a button to cancel selection of letter to exchange when there is not at least one letter selected', () => {
        component.lettersToExchange = [];
        fixture.detectChanges();
        const button = fixture.debugElement.nativeElement.querySelector('#cancel');
        expect(button).toBeFalsy();
    });

    it('cancel should return set lettersToExchange to an empty array', () => {
        component.lettersToExchange = [0];
        component.cancel();
        expect(component.lettersToExchange.length).toEqual(0);
    });

    it('noPlacedLetters should return noLettersPlaced from letterPlacementService', () => {
        const VALUE = true;
        letterPlacementServiceSpy.noLettersPlaced.and.returnValue(VALUE);
        expect(component.noPlacedLetters).toBeTruthy();
    });

    it('playPlacedLetters should call letterPlacementService.submitPlacement', () => {
        component.playPlacedLetters();
        expect(letterPlacementServiceSpy.submitPlacement).toHaveBeenCalled();
    });

    it('repositionRack should do nothing if the rack is empty and player tries to manipulate it', () => {
        gameClientServiceSpy.playerOne.rack = [];
        const moveLeftSpy = spyOn(component, 'moveLeft');
        component.buttonPressed = 'ArrowLeft';
        component.repositionRack();
        expect(moveLeftSpy).not.toHaveBeenCalled();

        const moveRightSpy = spyOn(component, 'moveRight');
        component.buttonPressed = 'ArrowRight';
        component.repositionRack();
        expect(moveRightSpy).not.toHaveBeenCalled();
    });

    it('repositionRack should call moveLeft', () => {
        const spy = spyOn(component, 'moveLeft');
        component.buttonPressed = 'ArrowLeft';
        component.repositionRack();
        expect(spy).toHaveBeenCalled();
    });

    it('repositionRack should call moveRight', () => {
        const spy = spyOn(component, 'moveRight');
        component.buttonPressed = 'ArrowRight';
        component.repositionRack();
        expect(spy).toHaveBeenCalled();
    });

    it('selectManipulation should not call repositionRack if the key pressed is not a left or right arrow', () => {
        const spy = spyOn(component, 'repositionRack');
        component.buttonPressed = 'a';
        expect(spy).not.toHaveBeenCalled();
    });

    it('dispatchAction should not call call cancel, repositionRack, and selectManipulation if the selection is not valid', () => {
        const cancelSpy = spyOn(component, 'cancel');
        const repositionRackSpy = spyOn(component, 'repositionRack');
        const selectManipulationSpy = spyOn(component, 'selectManipulation');
        component.currentSelection = -1;
        component.dispatchAction();
        expect(cancelSpy).not.toHaveBeenCalled();
        expect(repositionRackSpy).not.toHaveBeenCalled();
        expect(selectManipulationSpy).not.toHaveBeenCalled();
    });

    it('dispatchAction should call call cancel, repositionRack, and selectManipulation if the selection is not valid', () => {
        const cancelSpy = spyOn(component, 'cancel');
        const repositionRackSpy = spyOn(component, 'repositionRack');
        const selectManipulationSpy = spyOn(component, 'selectManipulation');
        component.currentSelection = 1;
        component.dispatchAction();
        expect(cancelSpy).toHaveBeenCalled();
        expect(repositionRackSpy).toHaveBeenCalled();
        expect(selectManipulationSpy).toHaveBeenCalled();
    });

    it('selectManipulation should not have previous selection if the key pressed references one letter', () => {
        const invalidIndex = -1;
        component.buttonPressed = 'o';
        expect(component.previousSelection).toEqual(invalidIndex);
        component.selectManipulation();
        expect(component.previousSelection).not.toEqual(invalidIndex);
    });

    it('lettersToManipulate should be empty if key pressed is not present on player rack', () => {
        const empty = 0;
        component.buttonPressed = 'q';
        component.selectManipulation();
        expect(component.lettersToManipulate.length).toEqual(empty);
    });

    it('selectManipulation should manipulate second iteration of a letter when the key has been pressed twice', () => {
        const invalidIndex = -1;
        component.buttonPressed = 'a';
        component.selectManipulation();
        component.selectManipulation();
        expect(component.previousSelection).not.toEqual(invalidIndex);
    });

    it('selectManipulation should manipulate the leftmost iteration the last one pressed was at the rightmost position in the rack', () => {
        const invalidIndex = -1;
        component.buttonPressed = 'a';
        component.selectManipulation();
        component.selectManipulation();
        component.selectManipulation();
        expect(component.duplicates.length).toEqual(2);
        expect(component.previousSelection).not.toEqual(invalidIndex);
    });

    it('moveRight should move letter to the beginning of the rack when the letter selected is at the end', () => {
        component.buttonPressed = 'ArrowRight';
        component.currentSelection = 6;
        component.moveRight();
        expect(component.currentSelection).toEqual(0);
    });

    it('moveRight should move letter one index to the right', () => {
        const expected = 3;
        component.buttonPressed = 'ArrowRight';
        component.currentSelection = 2;
        component.moveRight();
        expect(component.currentSelection).toEqual(expected);
    });
    it('moveRight should move letter one index to the right when player rack has less than 7 letters', () => {
        const expected = 0;

        gameClientServiceSpy.playerOne.rack = [
            {
                value: 'c',
                quantity: 2,
                points: 1,
            },

            {
                value: 'e',
                quantity: 2,
                points: 1,
            },

            {
                value: 'e',
                quantity: 2,
                points: 1,
            },
        ];

        component.buttonPressed = 'ArrowRight';
        component.currentSelection = 2;
        component.moveRight();
        expect(component.currentSelection).toEqual(expected);
    });

    it('moveLeft should move letter to the end of the rack when the letter selected is at the beginning', () => {
        const expected = 6;
        component.buttonPressed = 'ArrowLeft';
        component.currentSelection = 0;
        component.moveLeft();
        expect(component.currentSelection).toEqual(expected);
    });

    it('moveLeft should move letter one index to the left', () => {
        const expected = 4;
        component.buttonPressed = 'ArrowLeft';
        component.currentSelection = 5;
        component.moveLeft();
        expect(component.currentSelection).toEqual(expected);
    });

    it('moveLeft should move letter one index to the left when player rack has less than 7 letters', () => {
        const expected = 1;

        gameClientServiceSpy.playerOne.rack = [
            {
                value: 'd',
                quantity: 2,
                points: 1,
            },

            {
                value: 'k',
                quantity: 2,
                points: 1,
            },

            {
                value: 'r',
                quantity: 2,
                points: 1,
            },
        ];

        component.buttonPressed = 'ArrowLeft';
        component.currentSelection = 2;
        component.moveLeft();
        expect(component.currentSelection).toEqual(expected);
    });
});
