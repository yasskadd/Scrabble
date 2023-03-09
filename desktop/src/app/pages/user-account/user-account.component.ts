/* eslint-disable no-underscore-dangle */
import { HttpErrorResponse } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DialogBoxAvatarSelectorComponent } from '@app/components/dialog-box-avatar-selector/dialog-box-avatar-selector.component';
import { equalStringValidator } from '@app/directives/custom-validators';
import { AppRoutes } from '@app/models/app-routes';
import { HttpHandlerService } from '@app/services/communication/http-handler.service';
import { IUser } from '@common/interfaces/user';

@Component({
    selector: 'app-user-account',
    templateUrl: './user-account.component.html',
    styleUrls: ['./user-account.component.scss'],
})
export class UserAccountComponent {
    @ViewChild('avatarSelector', { static: false }) protected selector: any;
    readonly siteKey: string = '6Lf7L98kAAAAAJolI_AENbQSq32e_Wcv5dYBQA6D';

    formGroup: FormGroup;
    usernameForm: FormControl;
    emailForm: FormControl;
    passwordForm: FormControl;
    passwordCopyForm: FormControl;
    connectionError: string;

    constructor(private httpHandlerService: HttpHandlerService, private router: Router, private formBuilder: FormBuilder, private dialog: MatDialog) {
        this.usernameForm = new FormControl('', Validators.required);
        this.emailForm = new FormControl('', [Validators.required, Validators.email]);
        this.passwordForm = new FormControl('', Validators.required);
        this.passwordCopyForm = new FormControl('', [Validators.required]);
        this.connectionError = '';

        this.formGroup = this.formBuilder.group({
            usernameForm: this.usernameForm,
            emailForm: this.emailForm,
            passwordForm: this.passwordForm,
            passwordCopyForm: this.passwordCopyForm,
            recaptcha: ['', Validators.required],
        });

        this.addPasswordValidator();
    }

    protected openAvatarSelector(): void {
        this.dialog.open(DialogBoxAvatarSelectorComponent, {
            width: '360px',
            height: '420px',
            backdropClass: 'dialog-backdrop',
        });
    }

    protected submitNewAccount(): void {
        this.httpHandlerService
            .signUp({
                username: this.usernameForm.value,
                password: this.passwordForm.value,
            } as IUser)
            .subscribe({
                next: () => {
                    this.connectionError = '';
                    this.router.navigate([AppRoutes.HomePage]).then();
                },
                error: (error: HttpErrorResponse) => {
                    // TODO : Language
                    this.connectionError = error.error.message;
                    this.usernameForm.reset();
                },
            });
    }

    private addPasswordValidator(): void {
        let equalValidatorFn: ValidatorFn;
        this.passwordCopyForm.valueChanges.subscribe((newValue: string) => {
            this.passwordCopyForm.removeValidators(equalValidatorFn);
            equalValidatorFn = equalStringValidator(this.passwordForm.value);
            this.passwordCopyForm.addValidators(equalValidatorFn);
        });
    }
}
