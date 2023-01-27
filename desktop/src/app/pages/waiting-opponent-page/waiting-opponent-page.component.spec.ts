/* eslint-disable max-classes-per-file */
import { Component } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { GameConfigurationService } from '@app/services/game-configuration.service';
import { ReplaySubject } from 'rxjs';
import { WaitingOpponentPageComponent } from './waiting-opponent-page.component';

@Component({
    template: '',
})
export class StubComponent {}

interface RoomInformation {
    playerName: string[];
    roomId: string;
    isCreator: boolean;
    statusGame: string;
}
const ROOM_INFORMATION: RoomInformation = {
    playerName: ['Vincent'],
    roomId: '1',
    isCreator: true,
    statusGame: 'En attente du joueur',
};
const TEST_ERROR = "La salle n'est plus disponible";
const TEST_ERROR_REASON = new ReplaySubject<string>(1);
const TEST_ISGAMESTARTED = new ReplaySubject<string>(1);
const MULTIPLAYER_WAITING_ROOM_ROUTE = 'multijoueur/salleAttente/classique';
const MULTIPLAYER_CREATE_ROOM_ROUTE = 'multijoueur/creer/classique';
const SOLO_ROUTE = 'solo/classique';
const MULTIPLAYER_JOIN_ROOM_ROUTE = 'multijoueur/rejoindre/classique';
const MULTIPLAYER_GAME_PAGE = 'game';

describe('WaitingOpponentPageComponent', () => {
    let component: WaitingOpponentPageComponent;
    let fixture: ComponentFixture<WaitingOpponentPageComponent>;
    let gameConfigurationServiceSpy: jasmine.SpyObj<GameConfigurationService>;
    let router: Router;
    let matSnackBar: MatSnackBar;
    const mockMatSnackBar = {
        // Reason : mock that does nothing needed
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        open: () => {},
    };

    beforeEach(async () => {
        gameConfigurationServiceSpy = jasmine.createSpyObj(
            'GameConfigurationService',
            ['removeRoom', 'rejectOpponent', 'beginScrabbleGame', 'exitWaitingRoom'],
            {
                roomInformation: ROOM_INFORMATION,
                errorReason: TEST_ERROR_REASON,
                isGameStarted: TEST_ISGAMESTARTED,
            },
        );

        await TestBed.configureTestingModule({
            imports: [
                MatIconModule,
                MatCardModule,
                MatSnackBarModule,
                MatProgressBarModule,
                RouterTestingModule.withRoutes([
                    { path: MULTIPLAYER_CREATE_ROOM_ROUTE, component: StubComponent },
                    { path: MULTIPLAYER_JOIN_ROOM_ROUTE, component: StubComponent },
                    { path: MULTIPLAYER_GAME_PAGE, component: StubComponent },
                    { path: MULTIPLAYER_WAITING_ROOM_ROUTE, component: StubComponent },
                    { path: SOLO_ROUTE, component: StubComponent },
                ]),
            ],

            declarations: [WaitingOpponentPageComponent],
            providers: [
                { provide: GameConfigurationService, useValue: gameConfigurationServiceSpy },
                { provide: MatSnackBar, useValue: mockMatSnackBar },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            params: {
                                id: 'classique',
                            },
                        },
                    },
                },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(WaitingOpponentPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        router = TestBed.inject(Router);
        matSnackBar = TestBed.inject(MatSnackBar);
        component.gameMode = 'classique';
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

    it('exitRoom() should navigate to multijoueur/creer/classique if isCreated is true', () => {
        gameConfigurationServiceSpy.roomInformation.isCreator = true;
        const spyRouter = spyOn(router, 'navigate');
        const expectedURL = '/' + MULTIPLAYER_CREATE_ROOM_ROUTE;
        component.exitRoom();
        expect(spyRouter).toHaveBeenCalledWith([expectedURL]);
    });

    it('exitRoom() should navigate to /multijoueur/rejoindre/classique if isCreated is false', () => {
        gameConfigurationServiceSpy.roomInformation.isCreator = false;
        fixture.detectChanges();
        const spyRouter = spyOn(router, 'navigate');
        const expectedURL = '/' + MULTIPLAYER_JOIN_ROOM_ROUTE;
        component.exitRoom();
        expect(spyRouter).toHaveBeenCalledWith([expectedURL]);
    });

    it('exitRoom() should call gameConfiguration.exitWaitingRoom if you exit the waiting room while waiting for the other player to accept', () => {
        gameConfigurationServiceSpy.roomInformation.isCreator = false;
        fixture.detectChanges();
        component.exitRoom(true);
        expect(gameConfigurationServiceSpy.exitWaitingRoom).toHaveBeenCalled();
    });

    it('should have a button to start the game when you created the game', () => {
        gameConfigurationServiceSpy.roomInformation.isCreator = true;
        fixture.detectChanges();
        const button = fixture.debugElement.nativeElement.querySelector('.startButton');
        expect(button).toBeTruthy();
    });

    it('should have a button to convert to soloMode when you are waiting for an opponent', () => {
        gameConfigurationServiceSpy.roomInformation.isCreator = true;
        fixture.detectChanges();
        const button = fixture.debugElement.nativeElement.querySelector('.solo-mode-button');
        expect(button).toBeTruthy();
    });

    it('should  not have a button to convert to soloMode when you are joining someone else game', () => {
        gameConfigurationServiceSpy.roomInformation.isCreator = false;
        fixture.detectChanges();
        const button = fixture.debugElement.nativeElement.querySelector('.solo-mode-button');
        expect(button).toBeFalsy();
    });

    it('should not have a button to start the game when you did not created the game', () => {
        gameConfigurationServiceSpy.roomInformation.isCreator = false;
        fixture.detectChanges();
        const button = fixture.debugElement.nativeElement.querySelector('.startButton');
        expect(button).toBeFalsy();
    });

    it('should have a button to reject the opponent when you created the game', () => {
        gameConfigurationServiceSpy.roomInformation.isCreator = true;
        fixture.detectChanges();
        const button = fixture.debugElement.nativeElement.querySelector('.rejectButton');
        expect(button).toBeTruthy();
    });

    it('should  not have a button to reject the opponent when you did not created the game', () => {
        gameConfigurationServiceSpy.roomInformation.isCreator = true;
        fixture.detectChanges();
        const button = fixture.debugElement.nativeElement.querySelector('.rejectButton');
        expect(button).toBeTruthy();
    });

    it('should have a mat progress bar when you are waiting for the other player to accept your invitation', () => {
        gameConfigurationServiceSpy.roomInformation.isCreator = false;
        fixture.detectChanges();
        const progressBar = fixture.debugElement.nativeElement.querySelector('mat-progress-bar');
        expect(progressBar).toBeTruthy();
    });

    it('should have a mat progress bar when you are waiting for an other player to join your game', () => {
        gameConfigurationServiceSpy.roomInformation.playerName[1] = '';
        fixture.detectChanges();
        const progressBar = fixture.debugElement.nativeElement.querySelector('mat-progress-bar');

        expect(progressBar).toBeTruthy();
    });

    it('should not have a mat progress bar when a second player join the waiting room', () => {
        gameConfigurationServiceSpy.roomInformation.playerName[1] = 'Vincent';
        gameConfigurationServiceSpy.roomInformation.isCreator = true;
        fixture.detectChanges();
        const progressBar = fixture.debugElement.nativeElement.querySelector('mat-progress-bar');
        expect(progressBar).toBeFalsy();
    });

    it('should call startGame() when the startButton is pressed', fakeAsync(() => {
        gameConfigurationServiceSpy.roomInformation.playerName[1] = 'Vincent';
        gameConfigurationServiceSpy.roomInformation.isCreator = true;
        fixture.detectChanges();
        const spy = spyOn(component, 'startGame');
        const button = fixture.debugElement.nativeElement.querySelector('.startButton');
        button.click();
        tick();
        fixture.detectChanges();
        expect(spy).toHaveBeenCalled();
    }));

    it('should call soloMode() when the soloMode button is pressed and enable', fakeAsync(() => {
        gameConfigurationServiceSpy.roomInformation.isCreator = true;
        gameConfigurationServiceSpy.roomInformation.playerName[1] = '';
        fixture.detectChanges();
        const spy = spyOn(component, 'soloMode');
        const button = fixture.debugElement.nativeElement.querySelector('.solo-mode-button');
        button.click();
        tick();
        fixture.detectChanges();
        expect(spy).toHaveBeenCalled();
    }));

    it('should call rejectOpponent() when the rejectButton is pressed', fakeAsync(() => {
        gameConfigurationServiceSpy.roomInformation.playerName[1] = 'Vincent';
        gameConfigurationServiceSpy.roomInformation.isCreator = true;
        fixture.detectChanges();
        const spy = spyOn(component, 'rejectOpponent');
        const button = fixture.debugElement.nativeElement.querySelector('.rejectButton');
        button.click();
        tick();
        fixture.detectChanges();
        expect(spy).toHaveBeenCalled();
    }));

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

    it('soloMode() should navigate to solo/classique ', fakeAsync(() => {
        const spyRouter = spyOn(router, 'navigate');
        const expectedURL = '/' + SOLO_ROUTE;
        component.soloMode();
        tick();
        fixture.detectChanges();
        expect(spyRouter).toHaveBeenCalledWith([expectedURL]);
    }));

    it('should call gameConfiguration.removeRoom if the soloMode method is called', () => {
        component.soloMode();
        expect(gameConfigurationServiceSpy.removeRoom).toHaveBeenCalled();
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
            duration: 3000,
            verticalPosition: 'top',
        });
    });
});
