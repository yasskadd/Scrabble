import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DialogGameHelpComponent } from './dialog-game-help.component';

describe('DialogGameHelpComponent', () => {
    let component: DialogGameHelpComponent;
    let fixture: ComponentFixture<DialogGameHelpComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MatIconModule, MatCardModule, MatStepperModule, BrowserAnimationsModule],
            declarations: [DialogGameHelpComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DialogGameHelpComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
