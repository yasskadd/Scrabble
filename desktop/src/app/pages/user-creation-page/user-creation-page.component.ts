/* eslint-disable no-underscore-dangle */
import { Component, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DialogBoxAvatarSelectorComponent } from '@app/components/dialog-box-avatar-selector/dialog-box-avatar-selector.component';
import { MAX_EMAIL_LENGTH, MAX_TEXT_LENGTH } from '@app/constants/user';
import { equalStringValidator } from '@app/directives/custom-validators';
import { AppRoutes } from '@app/models/app-routes';
import { HttpHandlerService } from '@app/services/communication/http-handler.service';
import { SnackBarService } from '@app/services/snack-bar.service';
import { AvatarData } from '@common/interfaces/avatar-data';
import { ImageInfo } from '@common/interfaces/image-info';
import { IUser } from '@common/interfaces/user';
import { ImageType } from '@common/models/image-type';

@Component({
    selector: 'app-user-creation-page',
    templateUrl: './user-creation-page.component.html',
    styleUrls: ['./user-creation-page.component.scss'],
})
export class UserCreationPageComponent {
    @ViewChild('avatarSelector', { static: false }) protected selector: any;
    readonly siteKey: string = '6Lf7L98kAAAAAJolI_AENbQSq32e_Wcv5dYBQA6D';

    protected formGroup: FormGroup;
    protected profilePicForm: FormControl;
    protected usernameForm: FormControl;
    protected emailForm: FormControl;
    protected passwordForm: FormControl;
    protected passwordCopyForm: FormControl;
    protected recaptchaForm: FormControl;
    protected connectionError: string;
    protected imageData: string;

    protected imageTypes: typeof ImageType = ImageType;

    private equalValidatorFn: ValidatorFn;

    constructor(
        private httpHandlerService: HttpHandlerService,
        private snackBarService: SnackBarService,
        private router: Router,
        private dialog: MatDialog,
    ) {
        this.profilePicForm = new FormControl(undefined, [Validators.required]);
        this.usernameForm = new FormControl('', [Validators.required, Validators.maxLength(MAX_TEXT_LENGTH)]);
        this.emailForm = new FormControl('', [Validators.required, Validators.email, Validators.maxLength(MAX_EMAIL_LENGTH)]);
        this.recaptchaForm = new FormControl('', Validators.required);

        this.passwordForm = new FormControl('', [Validators.required, Validators.maxLength(MAX_TEXT_LENGTH)]);
        this.passwordCopyForm = new FormControl('', [Validators.required, Validators.maxLength(MAX_TEXT_LENGTH)]);
        this.addPasswordValidator();

        this.connectionError = '';

        this.profilePicForm.markAsTouched();
        this.usernameForm.markAsTouched();
        this.emailForm.markAsTouched();
        this.passwordForm.markAsTouched();
        this.passwordCopyForm.markAsTouched();
        this.recaptchaForm.markAsTouched();
    }

    protected openAvatarSelector(): void {
        this.dialog
            .open(DialogBoxAvatarSelectorComponent, {
                width: '360px',
                height: '420px',
                backdropClass: 'dialog-backdrop',
                data: this.profilePicForm.value,
            })
            .afterClosed()
            .subscribe((data: AvatarData) => {
                if (data) {
                    this.profilePicForm.setValue(data);
                }
            });
    }

    protected submitNewAccount(): void {
        const isDefaultPicture = this.profilePicForm.value.type === ImageType.Url;
        let profilePicture: ImageInfo;
        if (isDefaultPicture) {
            profilePicture = {
                name: this.profilePicForm.value.name,
                isDefaultPicture,
                key: this.profilePicForm.value.url,
            };
        } else {
            profilePicture = {
                name: this.profilePicForm.value.name,
                isDefaultPicture,
            };
        }
        this.httpHandlerService
            .signUp({
                email: this.emailForm.value,
                username: this.usernameForm.value,
                password: this.passwordForm.value,
                profilePicture,
            } as IUser)
            .then((res) => {
                if (res.message) {
                    this.snackBarService.openError(res.message);
                    return;
                }
                this.connectionError = '';

                if (!isDefaultPicture) {
                    this.httpHandlerService.sendProfilePicture(this.profilePicForm.value as AvatarData, res.imageKey);
                }

                this.router.navigate([AppRoutes.HomePage]).then();
            });
    }

    protected formValid(): boolean {
        return (
            this.profilePicForm.valid &&
            this.usernameForm.valid &&
            this.emailForm.valid &&
            this.passwordForm.valid &&
            this.passwordCopyForm.valid &&
            this.recaptchaForm.valid
        );
    }

    protected getErrorMessage(form: FormControl): string {
        // TODO : Language
        if (form.hasError('maxLength')) return 'Too long';
        if (form.hasError('required')) return 'Field required';
        if (form.hasError('email')) return 'Not a valid email address';
        if (form.hasError('equalString')) return "Passwords don't match";

        return '';
    }

    private addPasswordValidator(): void {
        this.passwordForm.valueChanges.subscribe(() => {
            this.equalValidatorFn = equalStringValidator(this.passwordForm.value);
            this.passwordCopyForm.setValidators([this.equalValidatorFn, Validators.required, Validators.maxLength(MAX_TEXT_LENGTH)]);
            this.passwordCopyForm.updateValueAndValidity();
        });
    }
}
