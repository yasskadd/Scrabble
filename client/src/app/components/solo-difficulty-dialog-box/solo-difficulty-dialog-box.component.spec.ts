import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { GameConfigurationService } from '@app/services/game-configuration.service';
import { SoloDifficultyDialogBoxComponent } from './solo-difficulty-dialog-box.component';

const GAME_PAGE = 'game';

@Component({
    template: '',
})
export class StubComponent {}

describe('SoloDifficultyDialogBoxComponent', () => {
    let component: SoloDifficultyDialogBoxComponent;
    let fixture: ComponentFixture<SoloDifficultyDialogBoxComponent>;
    let router: Router;
    let gameConfigurationServiceSpy: jasmine.SpyObj<GameConfigurationService>;

    beforeEach(async () => {
        gameConfigurationServiceSpy = jasmine.createSpyObj('GameConfigurationService', ['beginScrabbleGame', 'setGameAvailable']);

        await TestBed.configureTestingModule({
            declarations: [SoloDifficultyDialogBoxComponent],
            imports: [MatIconModule, RouterTestingModule.withRoutes([{ path: GAME_PAGE, component: StubComponent }])],
            providers: [{ provide: GameConfigurationService, useValue: gameConfigurationServiceSpy }],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SoloDifficultyDialogBoxComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        router = TestBed.inject(Router);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('easySoloMode should navigate to /game', () => {
        const spyRouter = spyOn(router, 'navigate');
        const expectedURL = '/' + GAME_PAGE;
        component.easySoloMode();
        expect(spyRouter).toHaveBeenCalledWith([expectedURL]);
    });

    it('easySoloMode should call gameConfiguration.beginScrabbleGame', () => {
        component.easySoloMode();
        expect(gameConfigurationServiceSpy.beginScrabbleGame).toHaveBeenCalledWith('Vincent');
    });

    it('returnWaiting should call gameConfiguration.setGameAvailable', () => {
        component.returnWaiting();
        expect(gameConfigurationServiceSpy.setGameAvailable).toHaveBeenCalled();
    });
});
