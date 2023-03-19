/* eslint-disable no-underscore-dangle */
import { HttpErrorResponse } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DialogBoxAvatarSelectorComponent } from '@app/components/dialog-box-avatar-selector/dialog-box-avatar-selector.component';
import { MAX_EMAIL_LENGTH, MAX_TEXT_LENGTH } from '@app/constants/user';
import { equalStringValidator } from '@app/directives/custom-validators';
import { AppRoutes } from '@app/models/app-routes';
import { HttpHandlerService } from '@app/services/communication/http-handler.service';
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
    protected connectionError: string;
    protected imageData: string;

    protected imageTypes: typeof ImageType = ImageType;

    constructor(private httpHandlerService: HttpHandlerService, private router: Router, private formBuilder: FormBuilder, private dialog: MatDialog) {
        this.profilePicForm = new FormControl(undefined, [Validators.required]);
        this.usernameForm = new FormControl('', [Validators.required, Validators.maxLength(MAX_TEXT_LENGTH)]);
        this.emailForm = new FormControl('', [Validators.required, Validators.email, Validators.maxLength(MAX_EMAIL_LENGTH)]);
        this.passwordForm = new FormControl('', [Validators.required, Validators.maxLength(MAX_TEXT_LENGTH)]);
        this.passwordCopyForm = new FormControl('', [Validators.required, Validators.maxLength(MAX_TEXT_LENGTH)]);
        this.connectionError = '';

        this.formGroup = this.formBuilder.group({
            profilePicForm: this.profilePicForm,
            usernameForm: this.usernameForm,
            emailForm: this.emailForm,
            passwordForm: this.passwordForm,
            passwordCopyForm: this.passwordCopyForm,
            // recaptcha: ['', Validators.required],
        });

        this.addPasswordValidator();
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
            .subscribe({
                next: (res: { imageKey: string }) => {
                    this.connectionError = '';

                    if (!isDefaultPicture) {
                        this.httpHandlerService.sendProfilePicture(this.profilePicForm.value as AvatarData, res.imageKey).subscribe();
                    }

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
        this.passwordCopyForm.valueChanges.subscribe(() => {
            this.passwordCopyForm.removeValidators(equalValidatorFn);
            equalValidatorFn = equalStringValidator(this.passwordForm.value);
            this.passwordCopyForm.addValidators(equalValidatorFn);
        });
    }
}
