import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormControl, Validators } from '@angular/forms';
import { AlphabetLetter } from '@common/models/alphabet-letter';
import { SnackBarService } from '@services/snack-bar.service';

@Component({
    selector: 'app-dialog-box-letter-selector',
    templateUrl: './dialog-box-letter-selector.component.html',
    styleUrls: ['./dialog-box-letter-selector.component.scss'],
})
export class DialogBoxLetterSelectorComponent {
    protected letterForm: FormControl;
    protected errorMessage: string;

    constructor(private snackBarService: SnackBarService, private dialogRef: MatDialogRef<DialogBoxLetterSelectorComponent>) {
        this.letterForm = new FormControl(AlphabetLetter.None, [Validators.minLength(1), Validators.maxLength(1), Validators.required]);

        this.letterForm.valueChanges.subscribe((value: string) => {
            console.log(value);
            this.updateValidity();
        });
        this.letterForm.markAsTouched();
    }

    protected close(): void {
        if (!this.updateValidity()) return;

        // TODO : Language
        this.snackBarService.openInfo('Letter ' + this.letterForm.value.toUpperCase() + ' selected');
        this.dialogRef.close(this.letterForm.value.toUpperCase());
    }

    private updateValidity(): boolean {
        if (this.letterForm.invalid) {
            console.log(this.letterForm.value);
            if (/[A-Z]/.test(this.letterForm.value)) {
                // TODO : Language
                this.errorMessage = 'Please enter a letter';
                return false;
            }
            // TODO : Language
            this.errorMessage = 'Invalid entry';
            return false;
        }

        return true;
    }
}
