import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MIN_PASSWORD_LENGTH } from '@app/constants/user';
import { MatDialogRef } from '@angular/material/dialog';
import { SnackBarService } from '@services/snack-bar.service';

@Component({
    selector: 'app-dialog-box-password',
    templateUrl: './dialog-box-password.component.html',
    styleUrls: ['./dialog-box-password.component.scss'],
})
export class DialogBoxPasswordComponent {
    protected passwordForm: FormControl;

    constructor(private snackBarService: SnackBarService, private dialogRef: MatDialogRef<DialogBoxPasswordComponent>) {
        this.passwordForm = new FormControl('', [Validators.required, Validators.minLength(MIN_PASSWORD_LENGTH)]);
    }
    protected close(): void {
        if (this.passwordForm.valid) {
            this.dialogRef.close(this.passwordForm.value);
            return;
        }

        // TODO : Lanaguage
        this.snackBarService.openError('Mot de passe invalide');
        this.dialogRef.close('');
    }

    protected getErrorMessage(): string {
        if (this.passwordForm.hasError('minlength')) {
            // TODO : Language
            return '8 caractères minimum';
        }

        return '';
    }
}
