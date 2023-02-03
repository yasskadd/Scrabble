import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { HighScoresService } from '@app/services/high-scores.service';
import { AdminHighScoresComponent } from './admin-high-scores.component';

describe('AdminHighScoresComponent', () => {
    let component: AdminHighScoresComponent;
    let fixture: ComponentFixture<AdminHighScoresComponent>;
    let highScoresServiceSpy: jasmine.SpyObj<HighScoresService>;

    beforeEach(async () => {
        highScoresServiceSpy = jasmine.createSpyObj('HighScoresService', ['getHighScores', 'openSnackBar', 'resetHighScores']);

        await TestBed.configureTestingModule({
            imports: [MatCardModule, MatIconModule],
            declarations: [AdminHighScoresComponent],
            schemas: [NO_ERRORS_SCHEMA],
            providers: [{ provide: HighScoresService, useValue: highScoresServiceSpy }],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AdminHighScoresComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
    it('should call resetHighScores when calling resetHighScores from component', () => {
        component.resetHighScores();
        expect(highScoresServiceSpy.resetHighScores).toHaveBeenCalled();
    });
});
