import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { RouterTestingModule } from '@angular/router/testing';
import { DialogBoxGameTypeComponent } from './dialog-box-game-type.component';

@Component({
    template: '',
})
class StubComponent {}
const DATA_GAME_MODE = 'classique';
const MULTIPLAYER_CREATE_ROUTE = 'multijoueur/creer/' + DATA_GAME_MODE;
const MULTIPLAYER_JOIN_ROUTE = 'multijoueur/rejoindre/' + DATA_GAME_MODE;

describe('DialogBoxGameTypeComponent', () => {
    let component: DialogBoxGameTypeComponent;
    let fixture: ComponentFixture<DialogBoxGameTypeComponent>;
    let location: Location;

    const dialogMock = {
        // Reason : we need a mock for testing purposes but it doesn<t need to do anything
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        close: () => {},
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                MatDialogModule,
                MatButtonModule,
                MatIconModule,
                RouterTestingModule.withRoutes([
                    { path: MULTIPLAYER_JOIN_ROUTE, component: StubComponent },
                    { path: MULTIPLAYER_CREATE_ROUTE, component: StubComponent },
                ]),
            ],
            declarations: [DialogBoxGameTypeComponent],
            providers: [
                { provide: MAT_DIALOG_DATA, useValue: DATA_GAME_MODE },
                { provide: MatDialogRef, useValue: dialogMock },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DialogBoxGameTypeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        location = TestBed.inject(Location);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('The multiplayer join button should redirect to the multiplayer join page', fakeAsync(() => {
        const button = fixture.debugElement.nativeElement.querySelector('#multiplayer-join');
        button.click();
        tick();

        const expectedURL = '/' + MULTIPLAYER_JOIN_ROUTE;
        expect(location.path()).toEqual(expectedURL);
    }));

    it('The multiplayer create button should redirect to the multiplayer create page', fakeAsync(() => {
        const button = fixture.debugElement.nativeElement.querySelector('#multiplayer-create');
        button.click();
        tick();

        const expectedURL = '/' + MULTIPLAYER_CREATE_ROUTE;
        expect(location.path()).toEqual(expectedURL);
    }));

    it('Game mode should be in the passed data', () => {
        expect(component.gameMode).toEqual(DATA_GAME_MODE);
    });
});
