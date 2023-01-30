import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DialogBoxModifyDictionaryComponent } from './dialog-box-modify-dictionary.component';

describe('DialogBoxModifyDictionaryComponent', () => {
    let component: DialogBoxModifyDictionaryComponent;
    let fixture: ComponentFixture<DialogBoxModifyDictionaryComponent>;

    const dialogMock = {
        // Reason : we need a mock for testing purposes but it doesn<t need to do anything
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        close: () => {},
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MatDialogModule, MatIconModule, MatFormFieldModule, MatInputModule, FormsModule, BrowserAnimationsModule],
            declarations: [DialogBoxModifyDictionaryComponent],
            providers: [
                { provide: MAT_DIALOG_DATA, useValue: {} },
                { provide: MatDialogRef, useValue: dialogMock },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DialogBoxModifyDictionaryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
