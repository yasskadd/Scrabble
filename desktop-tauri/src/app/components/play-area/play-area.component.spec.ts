import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSliderChange } from '@angular/material/slider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { Vec2 } from '@app/interfaces/vec2';
import { GameClientService } from '@app/services/game-client.service';
import { LetterPlacementService } from '@app/services/letter-placement.service';
import { Letter } from '@common/interfaces/letter';
import { Objective } from '@common/interfaces/objective';

type Timer = { minutes: number; seconds: number };
type Player = { name: string; score: number; rack: Letter[]; objective?: Objective[] };

const TIMER: Timer = { minutes: 1, seconds: 20 };

const OBJECTIVE_TWO: Objective = {
    name: 'NoClue',
    isPublic: true,
    points: 20,
    type: 'Word',
} as Objective;

const PLAYER_TWO: Player = {
    name: 'QLF',
    score: 327,
    rack: [
        { value: 'c', quantity: 2, points: 1 },
        { value: 'r', quantity: 2, points: 1 },
        { value: 'p', quantity: 2, points: 1 },
    ],
    room: '3',
    objective: [OBJECTIVE_TWO],
} as Player;

const PLAYER_ONE: Player = {
    name: '667',
    score: 23,
    rack: [
        { value: 'a', quantity: 2, points: 1 },
        { value: 'b', quantity: 2, points: 1 },
    ],
    room: '1',
    objective: [OBJECTIVE_TWO],
} as Player;

describe('PlayAreaComponent', () => {
    let component: PlayAreaComponent;
    let fixture: ComponentFixture<PlayAreaComponent>;
    let mouseEvent: MouseEvent;
    let letterPlacementServiceSpy: jasmine.SpyObj<LetterPlacementService>;
    let gameClientSpy: jasmine.SpyObj<GameClientService>;

    beforeEach(async () => {
        gameClientSpy = jasmine.createSpyObj('GameClientService', ['startTimer', 'quitGame', 'updateGameboard'], {
            playerOne: PLAYER_ONE,
            secondPlayer: PLAYER_TWO,
            gameTimer: TIMER,
        });

        letterPlacementServiceSpy = jasmine.createSpyObj('LetterPlacementService', [
            'undoPlacement',
            'submitPlacement',
            'undoEverything',
            'handlePlacement',
            'placeLetterStartPosition',
            'resetGameBoardView',
        ]);

        await TestBed.configureTestingModule({
            declarations: [PlayAreaComponent],
            schemas: [NO_ERRORS_SCHEMA],
            providers: [
                { provide: LetterPlacementService, useValue: letterPlacementServiceSpy },
                { provide: GameClientService, useValue: gameClientSpy },
                { provide: MatSnackBar, useValue: MatSnackBar },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PlayAreaComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call updateGameboard() when the mat-slider is triggered', () => {
        const mockSlider = new MatSliderChange();
        component.updateFontSize(mockSlider);
        fixture.detectChanges();
        expect(gameClientSpy.updateGameboard).toHaveBeenCalled();
        expect(letterPlacementServiceSpy.resetGameBoardView).toHaveBeenCalled();
    });

    it('mouseHitDetect should assign the mouse position to mousePosition variable', () => {
        const expectedPosition: Vec2 = { x: 100, y: 200 };
        mouseEvent = {
            offsetX: expectedPosition.x,
            offsetY: expectedPosition.y,
            button: 0,
        } as MouseEvent;
        component.mouseHitDetect(mouseEvent);
        expect(component.mousePosition).toEqual(expectedPosition);
    });

    /* eslint-disable @typescript-eslint/no-magic-numbers -- Add reason */
    it('mouseHitDetect should not change the mouse position if it is not a left click', () => {
        const expectedPosition: Vec2 = { x: 0, y: 0 };
        mouseEvent = {
            offsetX: expectedPosition.x + 10,
            offsetY: expectedPosition.y + 10,
            button: 1,
        } as MouseEvent;
        component.mouseHitDetect(mouseEvent);
        expect(component.mousePosition).not.toEqual({ x: mouseEvent.offsetX, y: mouseEvent.offsetY });
        expect(component.mousePosition).toEqual(expectedPosition);
    });

    it('mouseHitDetect should call letterService.placeLetterStartPosition ', () => {
        const expectedPosition: Vec2 = { x: 0, y: 0 };
        mouseEvent = {
            offsetX: expectedPosition.x + 10,
            offsetY: expectedPosition.y + 10,
            button: 0,
        } as MouseEvent;
        component.mouseHitDetect(mouseEvent);
        expect(letterPlacementServiceSpy.placeLetterStartPosition).toHaveBeenCalled();
    });

    it("mouseClickOutside should call letterService.undoEverything if the click isn't in the canvas", () => {
        const outsideClickEvent = new MouseEvent('click', { button: 0 });
        component.mouseClickOutside(outsideClickEvent);
        expect(letterPlacementServiceSpy.undoEverything).toHaveBeenCalled();
    });

    it("mouseClickOutside shouldn't call letterService.undoEverything if the click is in the canvas", () => {
        const outsideClickEvent = new MouseEvent('click');
        const node = document.createElement('test') as Node;
        Object.defineProperty(outsideClickEvent, 'target', { value: node as Node, enumerable: true });
        // Reason : tessting private attribute
        // eslint-disable-next-line dot-notation
        component['gridCanvas'].nativeElement.appendChild(node);
        component.mouseClickOutside(outsideClickEvent);
        expect(letterPlacementServiceSpy.undoEverything).not.toHaveBeenCalled();
    });

    it('buttonDetect should modify the buttonPressed variable', () => {
        const expectedKey = 'a';
        const buttonEvent = {
            key: expectedKey,
        } as KeyboardEvent;
        component.buttonDetect(buttonEvent);
        expect(component.buttonPressed).toEqual(expectedKey);
    });

    it('Enter keypress should call letterService.submitPlacement', () => {
        const enterKeypressEvent = new KeyboardEvent('keydown', { key: 'Enter' });
        fixture.debugElement.triggerEventHandler('keydown', enterKeypressEvent);
        expect(letterPlacementServiceSpy.submitPlacement).toHaveBeenCalled();
    });

    it('Backspace keypress should call letterService.undoPlacement', () => {
        const enterKeypressEvent = new KeyboardEvent('keydown', { key: 'Backspace' });
        fixture.debugElement.triggerEventHandler('keydown', enterKeypressEvent);
        expect(letterPlacementServiceSpy.undoPlacement).toHaveBeenCalled();
    });

    it('Escape keypress should call letterService.undoEverything', () => {
        const enterKeypressEvent = new KeyboardEvent('keydown', { key: 'Escape' });
        fixture.debugElement.triggerEventHandler('keydown', enterKeypressEvent);
        expect(letterPlacementServiceSpy.undoEverything).toHaveBeenCalled();
    });

    it("Shift keypress and the like shouldn't do anything", () => {
        const enterKeypressEvent = new KeyboardEvent('keydown', { key: 'Shift' });
        fixture.debugElement.triggerEventHandler('keydown', enterKeypressEvent);
        expect(letterPlacementServiceSpy.undoEverything).not.toHaveBeenCalled();
        expect(letterPlacementServiceSpy.undoPlacement).not.toHaveBeenCalled();
        expect(letterPlacementServiceSpy.handlePlacement).not.toHaveBeenCalled();
        expect(letterPlacementServiceSpy.submitPlacement).not.toHaveBeenCalled();
    });

    it('Other keypress should call letterService.handlePlacement', () => {
        const enterKeypressEvent = new KeyboardEvent('keydown', { key: 'a' });
        fixture.debugElement.triggerEventHandler('keydown', enterKeypressEvent);
        expect(letterPlacementServiceSpy.handlePlacement).toHaveBeenCalled();
    });

    it('should have a winning message when the game is finish', () => {
        gameClientSpy.isGameFinish = true;
        fixture.detectChanges();
        const message = fixture.debugElement.nativeElement.querySelector('#winning-message');
        expect(message).toBeTruthy();
    });

    it('should not have a winning message when the game is not finish', () => {
        gameClientSpy.isGameFinish = false;
        fixture.detectChanges();
        const message = fixture.debugElement.nativeElement.querySelector('#winning-message');
        expect(message).not.toBeTruthy();
    });
});
