import { Component } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { GameConfigurationService } from '@app/services/game-configuration.service';
import { ReplaySubject } from 'rxjs';
import { MultiplayerJoinPageComponent } from './multiplayer-join-page.component';

@Component({
    template: '',
})
export class StubComponent {}
const TEST_ROOM = [
    { id: '1', users: ['Vincent', 'Marcel'], dictionary: 'francais', timer: 1, mode: 'classique' },
    { id: '2', users: ['Paul', 'Jean'], dictionary: 'francais', timer: 1, mode: 'classique' },
];
const MULTIPLAYER_WAITING_ROOM_ROUTE = 'multijoueur/salleAttente/classique';
const TEST_ERROR = "La salle n'est plus disponible";
const TEST_ERROR_REASON = new ReplaySubject<string>(1);
const TEST_ISGAMESTARTED = new ReplaySubject<boolean>(1);
const TEST_ISROOMJOINABLE = new ReplaySubject<boolean>(1);
describe('MultiplayerJoinPageComponent', () => {
    let component: MultiplayerJoinPageComponent;
    let fixture: ComponentFixture<MultiplayerJoinPageComponent>;
    let gameConfigurationServiceSpy: jasmine.SpyObj<GameConfigurationService>;
    let router: Router;
    let matSnackBar: MatSnackBar;
    beforeEach(async () => {
        gameConfigurationServiceSpy = jasmine.createSpyObj(
            'GameConfigurationService',
            ['joinGame', 'joinPage', 'resetRoomInformation', 'joinRandomRoom'],
            {
                availableRooms: TEST_ROOM,
                errorReason: TEST_ERROR_REASON,
                isGameStarted: TEST_ISGAMESTARTED,
                isRoomJoinable: TEST_ISROOMJOINABLE,
            },
        );
        await TestBed.configureTestingModule({
            imports: [
                MatInputModule,
                ReactiveFormsModule,
                MatFormFieldModule,
                BrowserModule,
                MatIconModule,
                BrowserAnimationsModule,
                MatCardModule,
                FormsModule,
                MatSnackBarModule,
                RouterTestingModule.withRoutes([{ path: MULTIPLAYER_WAITING_ROOM_ROUTE, component: StubComponent }]),
            ],
            declarations: [MultiplayerJoinPageComponent],
            providers: [
                { provide: GameConfigurationService, useValue: gameConfigurationServiceSpy },
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
        fixture = TestBed.createComponent(MultiplayerJoinPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        router = TestBed.inject(Router);
        matSnackBar = TestBed.inject(MatSnackBar);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('navigatePage should navigate to /multijoueur/salleAttente/classique', () => {
        const spyRouter = spyOn(router, 'navigate');
        const expectedURL = '/' + MULTIPLAYER_WAITING_ROOM_ROUTE;
        component.navigatePage();
        expect(spyRouter).toHaveBeenCalledWith([expectedURL]);
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
    it('should call joinRoom() when the join-game button is pressed', fakeAsync(() => {
        component.playerName = 'Vincent';
        fixture.detectChanges();
        const spy = spyOn(component, 'joinRoom');
        const button = fixture.debugElement.nativeElement.querySelector('.join-game');
        button.click();
        tick();
        fixture.detectChanges();
        expect(spy).toHaveBeenCalled();
    }));

    it('should call joinRandomGame() when the joinRandomGame is pressed', fakeAsync(() => {
        component.playerName = 'Vincent';
        fixture.detectChanges();
        const spy = spyOn(component, 'joinRandomGame');
        const button = fixture.debugElement.nativeElement.querySelector('.join-random-game-button');
        button.click();
        tick();
        fixture.detectChanges();
        expect(spy).toHaveBeenCalled();
    }));

    it('should not be able to call joinRandomGame()when the player did not enter his name', fakeAsync(() => {
        fixture.detectChanges();
        const spy = spyOn(component, 'joinRandomGame');
        const button = fixture.debugElement.nativeElement.querySelector('.join-random-game-button');
        button.click();
        tick();
        fixture.detectChanges();
        expect(spy).not.toHaveBeenCalled();
    }));
    it('should not be able to call joinRoom() when the player did not enter his name', fakeAsync(() => {
        fixture.detectChanges();
        const spy = spyOn(component, 'joinRoom');
        const button = fixture.debugElement.nativeElement.querySelector('.join-game');
        button.click();
        tick();
        fixture.detectChanges();
        expect(spy).not.toHaveBeenCalled();
    }));
    it('joinRoom should call gameconfiguration.joinGame()', () => {
        const playerName = 'Marcel';
        component.playerName = playerName;
        fixture.detectChanges();
        component.joinRoom(gameConfigurationServiceSpy.availableRooms[0].id);
        fixture.detectChanges();
        expect(gameConfigurationServiceSpy.joinGame).toHaveBeenCalledWith(gameConfigurationServiceSpy.availableRooms[0].id, playerName);
        expect(component.playerName).toEqual('');
    });

    it('joinRandomGame should call gameconfiguration.joinRandomRoom() with the player name', () => {
        const playerName = 'Marcel';
        component.playerName = playerName;
        fixture.detectChanges();
        component.joinRandomGame();
        fixture.detectChanges();
        expect(gameConfigurationServiceSpy.joinRandomRoom).toHaveBeenCalledWith(playerName);
        expect(component.playerName).toEqual('');
    });
    it('should call navigatePage when the room is Joinable', () => {
        const spy = spyOn(component, 'navigatePage');
        gameConfigurationServiceSpy.isRoomJoinable.next(true);
        fixture.detectChanges();
        expect(spy).toHaveBeenCalledWith();
    });

    it('should  not call navigatePage when the room is not Joinable', () => {
        const spy = spyOn(component, 'navigatePage');
        gameConfigurationServiceSpy.isRoomJoinable.next(false);
        fixture.detectChanges();
        expect(spy).not.toHaveBeenCalledWith();
    });

    it('should have a table when there is room availables', () => {
        fixture.detectChanges();
        const table = fixture.debugElement.nativeElement.querySelector('.roomAvailable');
        expect(table).toBeTruthy();
    });
    it('should  not have a paragraph saying there is no room available when there is room availables', () => {
        fixture.detectChanges();
        const text = fixture.debugElement.nativeElement.querySelector('.noRoomAvailable');
        expect(text).toBeFalsy();
    });

    it('should have a button to join RandomGame if there is room available', () => {
        fixture.detectChanges();
        const text = fixture.debugElement.nativeElement.querySelector('.join-random-game-button');
        expect(text).toBeTruthy();
    });
    it('should open a snackBar when there an error while trying to join a multiplayer game', () => {
        const spy = spyOn(component, 'openSnackBar');
        gameConfigurationServiceSpy.errorReason.next(TEST_ERROR);
        fixture.detectChanges();
        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith(TEST_ERROR);
    });

    it('should not open a snackBar when there no error while trying to join a multiplayer game', () => {
        const spy = spyOn(component, 'openSnackBar');
        gameConfigurationServiceSpy.errorReason.next('');
        fixture.detectChanges();
        expect(spy).not.toHaveBeenCalled();
    });
    it('should call listenToServerResponse when the page is initialize', () => {
        const spy = spyOn(component, 'listenToServerResponse');
        component.ngOnInit();
        fixture.detectChanges();
        expect(spy).toHaveBeenCalled();
        expect(gameConfigurationServiceSpy.joinPage).toHaveBeenCalled();
    });
});
