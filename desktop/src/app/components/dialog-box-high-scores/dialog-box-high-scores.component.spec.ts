import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { DialogBoxHighScoresComponent } from './dialog-box-high-scores.component';

describe('DialogBoxHighScoresComponent', () => {
    let component: DialogBoxHighScoresComponent;
    let fixture: ComponentFixture<DialogBoxHighScoresComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MatCardModule, MatIconModule],
            schemas: [NO_ERRORS_SCHEMA],
            declarations: [DialogBoxHighScoresComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DialogBoxHighScoresComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
