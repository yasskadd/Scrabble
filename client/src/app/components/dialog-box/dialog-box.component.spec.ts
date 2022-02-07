import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { RouterTestingModule } from '@angular/router/testing';
import { DialogBoxComponent } from './dialog-box.component';

@Component({
    template: '',
})
class StubComponent {}
const DATA_GAME_MODE = 'Classique';
const MULTIPLAYER_CREATE_ROUTE = DATA_GAME_MODE + '/multijoueur/creer';
const MULTIPLAYER_JOIN_ROUTE = DATA_GAME_MODE + '/multijoueur/rejoindre';

describe('DialogBoxComponent', () => {
    let component: DialogBoxComponent;
    let fixture: ComponentFixture<DialogBoxComponent>;
    let location: Location;

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
            declarations: [DialogBoxComponent],
            providers: [{ provide: MAT_DIALOG_DATA, useValue: DATA_GAME_MODE }],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DialogBoxComponent);
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
