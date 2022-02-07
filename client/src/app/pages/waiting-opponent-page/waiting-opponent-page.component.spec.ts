// import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { GameConfigurationService } from '@app/services/game-configuration.service';
import { ReplaySubject } from 'rxjs';
import { WaitingOpponentPageComponent } from './waiting-opponent-page.component';
@Component({
    template: '',
})
export class StubComponent {}
const TEST_ERROR = "La salle n'est plus disponible";
const TEST_ISCREATOR = true;
// const TEST_ISNOTCREATOR = true;
const TEST_ERROR_REASON = new ReplaySubject<string>(1);
const TEST_ISGAMESTARTED = new ReplaySubject<string>(1);
const MULTIPLAYER_CREATE_ROOM_ROUTE = 'classique/multijoueur/creer';
const MULTIPLAYER_JOIN_ROOM_ROUTE = 'classique/multijoueur/rejoindre';
const MULTIPLAYER_GAME_PAGE = 'game';
describe('WaitingOpponentPageComponent', () => {
    let component: WaitingOpponentPageComponent;
    let fixture: ComponentFixture<WaitingOpponentPageComponent>;
    let gameConfigurationServiceSpy: jasmine.SpyObj<GameConfigurationService>;
    let router: Router;
    let matSnackBar: MatSnackBar;

    const mockMatSnackBar = {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        open: () => {},
    };

    beforeEach(async () => {
        gameConfigurationServiceSpy = jasmine.createSpyObj('GameConfigurationService', ['removeRoom', 'rejectOpponent', 'beginScrabbleGame'], {
            isCreator: TEST_ISCREATOR,
            errorReason: TEST_ERROR_REASON,
            isGameStarted: TEST_ISGAMESTARTED,
            playerName: [],
        });

        await TestBed.configureTestingModule({
            imports: [
                MatSnackBarModule,
                RouterTestingModule.withRoutes([
                    { path: MULTIPLAYER_CREATE_ROOM_ROUTE, component: StubComponent },
                    { path: MULTIPLAYER_JOIN_ROOM_ROUTE, component: StubComponent },
                    { path: MULTIPLAYER_GAME_PAGE, component: StubComponent },
                ]),
            ],

            declarations: [WaitingOpponentPageComponent],
            providers: [
                { provide: GameConfigurationService, useValue: gameConfigurationServiceSpy },
                { provide: MatSnackBar, useValue: mockMatSnackBar },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(WaitingOpponentPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        router = TestBed.inject(Router);
        matSnackBar = TestBed.inject(MatSnackBar);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call exitRoom() when the returnButton is pressed', fakeAsync(() => {
        fixture.detectChanges();
        const spy = spyOn(component, 'exitRoom');
        const button = fixture.debugElement.nativeElement.querySelector('.returnButton');
        button.click();

        tick();
        fixture.detectChanges();
        expect(spy).toHaveBeenCalled();
    }));

    it('exitRoom() should navigate to /classique/multijoueur/creer if isCreated is true', () => {
        const spyRouter = spyOn(router, 'navigate');
        const expectedURL = '/' + MULTIPLAYER_CREATE_ROOM_ROUTE;
        component.exitRoom();
        expect(spyRouter).toHaveBeenCalledWith([expectedURL]);
    });

    // TODO: Fix this test later
    // it('exitRoom() should navigate to /classique/multijoueur/joindre if isCreated is false', () => {
    //     gameConfigurationServiceSpy = jasmine.createSpyObj('GameConfigurationService', ['rejectOpponent', 'beginScrabbleGame'], {
    //         isCreator: TEST_ISNOTCREATOR,
    //         errorReason: TEST_ERROR_REASON,
    //         isGameStarted: TEST_ISGAMESTARTED,
    //     });
    //     fixture.detectChanges();
    //     const spyRouter = spyOn(router, 'navigate');
    //     const expectedURL = '/' + MULTIPLAYER_JOIN_ROOM_ROUTE;
    //     component.exitRoom();
    //     expect(spyRouter).toHaveBeenCalledWith([expectedURL]);
    // });

    it('rejectOpponent should call gameconfiguration.rejectOponent()', () => {
        component.rejectOpponent();
        fixture.detectChanges();
        expect(gameConfigurationServiceSpy.rejectOpponent).toHaveBeenCalled();
    });

    it('startGame should call gameconfiguration.beginScrabbleGame()', () => {
        component.startGame();
        fixture.detectChanges();
        expect(gameConfigurationServiceSpy.beginScrabbleGame).toHaveBeenCalled();
    });

    it('should call gameConfiguration.removeRoom if he want to exitWaitingRoom and he is the creator', () => {
        component.startGame();
        fixture.detectChanges();
        expect(gameConfigurationServiceSpy.beginScrabbleGame).toHaveBeenCalled();
    });

    it('should call joinGamePage when the isGameStarted value is true', () => {
        const spy = spyOn(component, 'joinGamePage');
        gameConfigurationServiceSpy.isGameStarted.next(true);
        fixture.detectChanges();
        expect(spy).toHaveBeenCalled();
    });

    it('should not call joinGamePage when the isGameStarted value is false', () => {
        const spy = spyOn(component, 'joinGamePage');
        gameConfigurationServiceSpy.isGameStarted.next(false);
        fixture.detectChanges();
        expect(spy).not.toHaveBeenCalled();
    });

    it('should call exitRoom when there is no errorReason', () => {
        const spy = spyOn(component, 'exitRoom');
        gameConfigurationServiceSpy.errorReason.next('');
        fixture.detectChanges();
        expect(spy).toHaveBeenCalled();
    });

    it('should call exitRoom when there is a errorReason', () => {
        const spy = spyOn(component, 'exitRoom');
        gameConfigurationServiceSpy.errorReason.next(TEST_ERROR);
        fixture.detectChanges();
        expect(spy).toHaveBeenCalled();
    });

    it('openSnackBar should call the MatSnackBar open method', () => {
        const matSnackBarSpy = spyOn(matSnackBar, 'open').and.stub();
        component.openSnackBar(TEST_ERROR);
        expect(matSnackBarSpy.calls.count()).toBe(1);
        const args = matSnackBarSpy.calls.argsFor(0);
        expect(args[0]).toBe(TEST_ERROR);
        expect(args[1]).toBe('fermer');
        expect(args[2]).toEqual({
            verticalPosition: 'top',
        });
    });
});
