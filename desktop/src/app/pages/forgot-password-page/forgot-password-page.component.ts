import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAX_TEXT_LENGTH } from '@app/constants/user';
import { LanguageService } from '@app/services/language.service';
import { HttpHandlerService } from '@services/communication/http-handler.service';
import { SnackBarService } from '@services/snack-bar.service';

@Component({
    selector: 'app-forgot-password-page',
    templateUrl: './forgot-password-page.component.html',
    styleUrls: ['./forgot-password-page.component.scss'],
})
export class ForgotPasswordPageComponent {
    protected formGroup: FormGroup;
    protected usernameForm: FormControl;
    protected passwordForm: FormControl;
    protected connectionError: string;

    constructor(
        private httpHandlerService: HttpHandlerService,
        private formBuilder: FormBuilder,
        private snackBarService: SnackBarService,
        private languageService: LanguageService,
    ) {
        this.usernameForm = new FormControl('', [Validators.required, Validators.maxLength(MAX_TEXT_LENGTH)]);
        this.passwordForm = new FormControl('', [Validators.required, Validators.maxLength(MAX_TEXT_LENGTH)]);
        this.connectionError = '';

        this.formGroup = this.formBuilder.group({
            usernameForm: this.usernameForm,
        });
    }

    protected forgot(): void {
        if (this.usernameForm.invalid) {
            this.snackBarService.openError('Please enter a valid username');
            return;
        }

        this.httpHandlerService.forgotPassword(this.usernameForm.value).then((response) => {
            console.log(response.body);
            if (response.body === 'Created') {
                this.languageService.getWord('forgot-password.success').subscribe((word: string) => {
                    this.snackBarService.openEmailInfo(word);
                });
                return;
            }
            this.languageService.getWord('forgot-password.error').subscribe((word: string) => {
                this.snackBarService.openError(word);
            });
        });
    }
}
