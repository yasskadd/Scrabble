import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { GameConfigurationService } from '@app/services/game-configuration.service';
import { ReplaySubject } from 'rxjs';
import { MultiplayerJoinPageComponent } from './multiplayer-join-page.component';
@Component({
    template: '',
})
export class StubComponent {}
const TEST_ROOM = [{ id: '1', users: ['Vincent', 'Marcel'], dictionary: 'francais', timer: 1, mode: 'classique' }];
const MULTIPLAYER_CREATE_ROOM_ROUTE = 'classique/multijoueur/salleAttente';
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
        gameConfigurationServiceSpy = jasmine.createSpyObj('GameConfigurationService', ['joinGame', 'joinPage'], {
            availableRooms: TEST_ROOM,
            errorReason: TEST_ERROR_REASON,
            isGameStarted: TEST_ISGAMESTARTED,
            isRoomJoinable: TEST_ISROOMJOINABLE,
        });
        await TestBed.configureTestingModule({
            imports: [
                BrowserAnimationsModule,
                MatCardModule,
                FormsModule,
                MatSnackBarModule,
                RouterTestingModule.withRoutes([{ path: MULTIPLAYER_CREATE_ROOM_ROUTE, component: StubComponent }]),
            ],
            declarations: [MultiplayerJoinPageComponent],
            providers: [{ provide: GameConfigurationService, useValue: gameConfigurationServiceSpy }],
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

    it('navigatePage should navigate to /classique/multijoueur/salleAttente', () => {
        const spyRouter = spyOn(router, 'navigate');
        const expectedURL = '/' + MULTIPLAYER_CREATE_ROOM_ROUTE;
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
            verticalPosition: 'top',
        });
    });
    // TODO:Test to fix
    // it('should call joinRoom() when the joinGameButton is pressed', fakeAsync(() => {
    //     fixture.detectChanges();
    //     const spy = spyOn(component, 'joinRoom');
    //     const button = fixture.debugElement.nativeElement.querySelector('.joinGameButton');
    //     button.click();
    //     tick();
    //     fixture.detectChanges();
    //     expect(spy).toHaveBeenCalled();
    // }));
    it('joinRoom should call gameconfiguration.joinGame()', () => {
        const NAME_PLAYER = 'Marcel';
        component.playerName = NAME_PLAYER;
        fixture.detectChanges();
        component.joinRoom(gameConfigurationServiceSpy.availableRooms[0].id);
        fixture.detectChanges();
        expect(gameConfigurationServiceSpy.joinGame).toHaveBeenCalledWith(gameConfigurationServiceSpy.availableRooms[0].id, NAME_PLAYER);
        expect(component.playerName).toEqual('');
    });

    it('Should call navigatePage when the room is Joinable', () => {
        const spy = spyOn(component, 'navigatePage');
        gameConfigurationServiceSpy.isRoomJoinable.next(true);
        fixture.detectChanges();
        expect(spy).toHaveBeenCalledWith();
    });

    it('Should  not call navigatePage when the room is not Joinable', () => {
        const spy = spyOn(component, 'navigatePage');
        gameConfigurationServiceSpy.isRoomJoinable.next(false);
        fixture.detectChanges();
        expect(spy).not.toHaveBeenCalledWith();
    });

    it('Should open a snackBar when there an error while trying to join a multiplayer game', () => {
        const spy = spyOn(component, 'openSnackBar');
        gameConfigurationServiceSpy.errorReason.next(TEST_ERROR);
        fixture.detectChanges();
        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith(TEST_ERROR);
    });

    it('Should not open a snackBar when there no error while trying to join a multiplayer game', () => {
        const spy = spyOn(component, 'openSnackBar');
        gameConfigurationServiceSpy.errorReason.next('');
        fixture.detectChanges();
        expect(spy).not.toHaveBeenCalled();
    });
    it('Should call listenToServerResponse when the page is initialize', () => {
        const spy = spyOn(component, 'listenToServerResponse');
        component.ngOnInit();
        fixture.detectChanges();
        expect(spy).toHaveBeenCalled();
        expect(gameConfigurationServiceSpy.joinPage).toHaveBeenCalled();
    });
});
