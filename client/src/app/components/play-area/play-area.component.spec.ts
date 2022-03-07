import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { PlayerRackComponent } from '@app/components/player-rack/player-rack.component';
import { Vec2 } from '@app/interfaces/vec2';
import { GameClientService } from '@app/services/game-client.service';
import { Letter } from '@common/letter';

describe('PlayAreaComponent', () => {
    let component: PlayAreaComponent;
    let fixture: ComponentFixture<PlayAreaComponent>;
    let mouseEvent: MouseEvent;
    let gameClientServiceSpy: jasmine.SpyObj<GameClientService>;

    beforeEach(async () => {
        gameClientServiceSpy = jasmine.createSpyObj('GameClientService', ['updateGameboard'], {
            playerOneTurn: true,
            playerOne: { rack: [{ value: 'a' } as Letter] },
        });
        await TestBed.configureTestingModule({
            declarations: [PlayAreaComponent, PlayerRackComponent],
            providers: [{ provide: GameClientService, useValue: gameClientServiceSpy }],
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

    it('buttonDetect should modify the buttonPressed variable', () => {
        const expectedKey = 'a';
        const buttonEvent = {
            key: expectedKey,
        } as KeyboardEvent;
        component.buttonDetect(buttonEvent);
        expect(component.buttonPressed).toEqual(expectedKey);
    });
});
