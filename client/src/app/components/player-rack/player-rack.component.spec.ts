import { ElementRef } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import * as constants from '@app/constants';
import { ChatboxHandlerService } from '@app/services/chatbox-handler.service';
import { GameClientService } from '@app/services/game-client.service';
import { GridService } from '@app/services/grid.service';
import { of, Subject } from 'rxjs';
import { PlayerRackComponent } from './player-rack.component';

const LETTER_SIZE = 5;
class MockElementRef extends ElementRef {}

describe('PlayerRackComponent', () => {
    let component: PlayerRackComponent;
    let fixture: ComponentFixture<PlayerRackComponent>;
    let chatBoxHandlerSpy: jasmine.SpyObj<ChatboxHandlerService>;
    let gameClientServiceSpy: jasmine.SpyObj<GameClientService>;
    let gridServiceServiceSpy: jasmine.SpyObj<GridService>;

    beforeEach(async () => {
        chatBoxHandlerSpy = jasmine.createSpyObj('ChatboxHandlerService', ['submitMessage']);
        gameClientServiceSpy = jasmine.createSpyObj('GameClientService', ['updateGameboard'], {
            playerOneTurn: true,
            playerOne: {
                rack: [
                    {
                        value: 'a',
                        quantity: 2,
                        points: 1,
                        isBlankLetter: false,
                    },

                    {
                        value: 'd',
                        quantity: 2,
                        points: 1,
                        isBlankLetter: false,
                    },

                    {
                        value: 'a',
                        quantity: 2,
                        points: 1,
                        isBlankLetter: false,
                    },

                    {
                        value: 'm',
                        quantity: 2,
                        points: 1,
                        isBlankLetter: false,
                    },

                    {
                        value: 's',
                        quantity: 2,
                        points: 1,
                        isBlankLetter: false,
                    },

                    {
                        value: 'o',
                        quantity: 2,
                        points: 1,
                        isBlankLetter: false,
                    },
                ],
            },
        });
        gridServiceServiceSpy = jasmine.createSpyObj('GridService', [], { letterSize: LETTER_SIZE });
        await TestBed.configureTestingModule({
            declarations: [PlayerRackComponent],
            providers: [
                { provide: ChatboxHandlerService, useValue: chatBoxHandlerSpy },
                { provide: GameClientService, useValue: gameClientServiceSpy },
                { provide: GridService, useValue: gridServiceServiceSpy },
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
        const button = fixture.debugElement.nativeElement.querySelector('#skipTurn');
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
        fixture.detectChanges();
        const lettersDiv = fixture.debugElement.nativeElement.querySelector('#player-letters').children;
        expect(component.lettersToExchange.length).toEqual(1);
        expect(lettersDiv[indexLetter].className).toEqual('rack-letter-exchange-selected');
    });

    it('onLeftClick should call cancel', () => {
        const indexLetter = 0;
        const mockClick = new MouseEvent('click');
        const spy = spyOn(component, 'cancel');
        component.onLeftClick(mockClick, indexLetter);
        fixture.detectChanges();
        expect(spy).toHaveBeenCalled();
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

    it('cancel should return set lettersToExchange to an empty array', () => {
        component.lettersToExchange = [0];
        component.cancel();
        expect(component.lettersToExchange.length).toEqual(0);
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

    it('selectManipulation should call repositionRack if the key pressed is a left arrow', () => {
        const spy = spyOn(component, 'repositionRack');
        const mockKey = new KeyboardEvent('keydown');
        component.buttonPressed = 'ArrowLeft';
        component.selectManipulation(mockKey);
        expect(spy).toHaveBeenCalled();
    });

    it('selectManipulation should call repositionRack if the key pressed is a right arrow', () => {
        const spy = spyOn(component, 'repositionRack');
        const mockKey = new KeyboardEvent('keydown');
        component.buttonPressed = 'ArrowRight';
        component.selectManipulation(mockKey);
        expect(spy).toHaveBeenCalled();
    });

    it('selectManipulation should not call repositionRack if the key pressed is not a left or right arrow', () => {
        const spy = spyOn(component, 'repositionRack');
        const mockKey = new KeyboardEvent('keydown', { key: 'a' });
        component.buttonPressed = 'a';
        component.selectManipulation(mockKey);
        expect(spy).not.toHaveBeenCalled();
    });

    it('selectManipulation should not have previous selection if the key pressed references one letter', () => {
        const invalidIndex = -1;
        const mockKey = new KeyboardEvent('keydown', { key: 'o' });
        component.buttonPressed = 'o';
        component.selectManipulation(mockKey);
        expect(component.previousSelection).toEqual(invalidIndex);
    });

    it('selectManipulation should manipulate second iteration of a letter when the key has been pressed twice', () => {
        const invalidIndex = -1;
        const mockKey = new KeyboardEvent('keydown', { key: 'a' });
        component.buttonPressed = 'a';
        component.selectManipulation(mockKey);
        component.selectManipulation(mockKey);
        expect(component.previousSelection).not.toEqual(invalidIndex);
    });

    it('selectManipulation should manipulate the leftmost iteration the last one pressed was at the rightmost position in the rack', () => {
        const invalidIndex = -1;
        const mockKey = new KeyboardEvent('keydown', { key: 'a' });
        component.buttonPressed = 'a';
        component.selectManipulation(mockKey);
        component.selectManipulation(mockKey);
        component.selectManipulation(mockKey);
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
});
