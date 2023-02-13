import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DialogBoxModifyBotNamesComponent } from './dialog-box-modify-bot-names.component';

const DATA_PLAYER_NAME = 'vincent';

describe('DialogBoxNewGameComponent', () => {
    let component: DialogBoxModifyBotNamesComponent;
    let fixture: ComponentFixture<DialogBoxModifyBotNamesComponent>;

    const dialogMock = {
        // Reason : we need a mock for testing purposes but it doesn<t need to do anything
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        close: () => {},
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MatDialogModule, MatFormFieldModule, MatInputModule, BrowserAnimationsModule, FormsModule],
            declarations: [DialogBoxModifyBotNamesComponent],
            providers: [
                { provide: MAT_DIALOG_DATA, useValue: DATA_PLAYER_NAME },
                { provide: MatDialogRef, useValue: dialogMock },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DialogBoxModifyBotNamesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('dialog should be closed after onYesClick()', () => {
        // Reason : testing private attribute
        // eslint-disable-next-line dot-notation
        const spy = spyOn(component['dialogRef'], 'close').and.callThrough();
        component.onNoClick();
        expect(spy).toHaveBeenCalled();
    });
});
