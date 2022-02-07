// eslint-disable-next-line max-classes-per-file
import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { GameConfigurationService } from '@app/services/game-configuration.service';
import { MultiplayerCreatePageComponent } from './multiplayer-create-page.component';
@Component({
    template: '',
})
export class StubComponent {}

const MULTIPLAYER_CREATE_ROOM_ROUTE = 'classique/multijoueur/salleAttente';
const RETURN_ROUTE = 'home';
describe('MultiplayerCreatePageComponent', () => {
    let component: MultiplayerCreatePageComponent;
    let fixture: ComponentFixture<MultiplayerCreatePageComponent>;
    let location: Location;
    let gameConfigurationServiceSpy: jasmine.SpyObj<GameConfigurationService>;
    beforeEach(async () => {
        gameConfigurationServiceSpy = jasmine.createSpyObj('GameConfigurationService', ['gameInitialization']);
        await TestBed.configureTestingModule({
            imports: [
                RouterTestingModule.withRoutes([
                    { path: MULTIPLAYER_CREATE_ROOM_ROUTE, component: StubComponent },
                    { path: RETURN_ROUTE, component: StubComponent },
                ]),
            ],

            declarations: [MultiplayerCreatePageComponent],
            providers: [{ provide: GameConfigurationService, useValue: gameConfigurationServiceSpy }],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(MultiplayerCreatePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        location = TestBed.inject(Location);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('navigatePage should redirect to salleAttente', fakeAsync(() => {
        const expectedURL = '/' + MULTIPLAYER_CREATE_ROOM_ROUTE;
        component.navigatePage();
        tick();
        fixture.detectChanges();
        expect(location.path()).toEqual(expectedURL);
    }));

    it('returnButton should redirect to home', fakeAsync(() => {
        const button = fixture.debugElement.nativeElement.querySelector('.returnButton');
        button.click();
        tick();
        fixture.detectChanges();
        const expectedURL = '/' + RETURN_ROUTE;
        expect(location.path()).toEqual(expectedURL);
    }));

    // TODO: fix this test afterr
    // it('should call createGame() when the startButton is pressed', fakeAsync(() => {
    //     fixture.detectChanges();
    //     const spy = spyOn(component, 'createGame');
    //     const button = fixture.debugElement.nativeElement.querySelector('.startButton');
    //     button.click();

    //     tick();
    //     fixture.detectChanges();
    //     expect(spy).toHaveBeenCalled();
    // }));

    it('createGame should call gameConfiguration.gameInitialization', fakeAsync(() => {
        component.playerName = 'Vincent';
        component.createGame();
        expect(gameConfigurationServiceSpy.gameInitialization).toHaveBeenCalled();
    }));

    it('createGame should call gameConfiguration.gameInitialization with the good Value', fakeAsync(() => {
        component.playerName = 'Vincent';
        const TEST_PLAYER = { username: component.playerName, timer: 1, dictionary: 'francais', mode: 'classique' };
        component.createGame();
        expect(gameConfigurationServiceSpy.gameInitialization).toHaveBeenCalled();
        expect(gameConfigurationServiceSpy.gameInitialization).toHaveBeenCalledWith(TEST_PLAYER);
    }));
    it('createGame should call navigatePage', fakeAsync(() => {
        const spy = spyOn(component, 'navigatePage');
        component.createGame();

        expect(spy).toHaveBeenCalled();
    }));
    it('createGame should call resetInput', fakeAsync(() => {
        // Testing private method
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const spy = spyOn<any>(component, 'resetInput');

        component.createGame();
        expect(spy).toHaveBeenCalled();
    }));
    it('ResetInput() should clear the playerName', () => {
        const VALID_NAME = 'Serge';
        component.playerName = VALID_NAME;
        // Testing private method
        // eslint-disable-next-line dot-notation
        component['resetInput']();
        expect(component.playerName).toEqual('');
    });
});
