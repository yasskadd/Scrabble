// Reason : a lot of components are used in game-page
// eslint-disable-next-line max-classes-per-file
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSliderModule } from '@angular/material/slider';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { ChatboxComponent } from '@app/components/chatbox/chatbox.component';
import { InformationPanelComponent } from '@app/components/information-panel/information-panel.component';
import { PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { PlayerRackComponent } from '@app/components/player-rack/player-rack.component';
import { GameClientService } from '@app/services/game-client.service';
import { of, Subject } from 'rxjs';
import { GamePageComponent } from './game-page.component';

@Component({
    template: '',
})
export class StubComponent {}

export class MatDialogMock {
    open() {
        return {
            afterClosed: () => of({ action: true }),
        };
    }
}
describe('GamePageComponent', () => {
    let component: GamePageComponent;
    let fixture: ComponentFixture<GamePageComponent>;
    let gameServiceSpy: jasmine.SpyObj<GameClientService>;
    let gameUpdatedStub: Subject<boolean>;

    beforeEach(async () => {
        gameUpdatedStub = new Subject();
        gameServiceSpy = jasmine.createSpyObj('GameClientService', ['resetGameInformation'], { gameboardUpdated: gameUpdatedStub });
        gameServiceSpy.gameboardUpdated = gameUpdatedStub;
        await TestBed.configureTestingModule({
            imports: [
                MatProgressSpinnerModule,
                MatCardModule,
                MatIconModule,
                MatSliderModule,
                MatFormFieldModule,
                FormsModule,
                ReactiveFormsModule,
                MatInputModule,
                BrowserAnimationsModule,
                BrowserModule,
                RouterTestingModule.withRoutes([{ path: 'home', component: StubComponent }]),
            ],
            declarations: [GamePageComponent, PlayAreaComponent, PlayerRackComponent, ChatboxComponent, InformationPanelComponent],

            providers: [
                { provide: MatDialog, useClass: MatDialogMock },
                { provide: GameClientService, useValue: gameServiceSpy },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GamePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should change loading when receiving information on the game', () => {
        gameUpdatedStub.next(true);
        expect(component.isLoading).toBeFalsy();
    });
});
