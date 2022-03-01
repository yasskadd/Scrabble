import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import * as constants from '@app/constants';
import { ChatboxHandlerService } from '@app/services/chatbox-handler.service';
import { GameClientService } from '@app/services/game-client.service';
import { GridService } from '@app/services/grid.service';
import { PlayerRackComponent } from './player-rack.component';

const LETTER_SIZE = 5;

describe('PlayerRackComponent', () => {
    let component: PlayerRackComponent;
    let fixture: ComponentFixture<PlayerRackComponent>;
    let chatBoxHandlerSpy: jasmine.SpyObj<ChatboxHandlerService>;
    let gameClientServiceSpy: jasmine.SpyObj<GameClientService>;
    let gridServiceServiceSpy: jasmine.SpyObj<GridService>;

    beforeEach(async () => {
        chatBoxHandlerSpy = jasmine.createSpyObj('ChatboxHandlerService', ['submitMessage']);
        gameClientServiceSpy = jasmine.createSpyObj('GameClientService', ['updateGameboard'], { playerOneTurn: true, playerOne: { rack: [] } });
        gridServiceServiceSpy = jasmine.createSpyObj('GridService', [], { letterSize: LETTER_SIZE });
        await TestBed.configureTestingModule({
            declarations: [PlayerRackComponent],
            providers: [
                { provide: ChatboxHandlerService, useValue: chatBoxHandlerSpy },
                { provide: GameClientService, useValue: gameClientServiceSpy },
                { provide: GridService, useValue: gridServiceServiceSpy },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PlayerRackComponent);
        component = fixture.componentInstance;
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
    it("letterSize should return a letter's size", () => {
        expect(component.letterSize).toEqual(LETTER_SIZE);
    });
    it("pointsSize should return a letter's size", () => {
        expect(component.pointsSize).toEqual(LETTER_SIZE * constants.LETTER_WEIGHT_RATIO);
    });
});
