/* eslint-disable no-underscore-dangle */
import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { DialogBoxAvatarSelectorComponent } from '@app/components/dialog-box-avatar-selector/dialog-box-avatar-selector.component';

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

    constructor(private formBuilder: FormBuilder, private dialog: MatDialog) {
        this.usernameForm = new FormControl('', Validators.required);
        this.emailForm = new FormControl('', [Validators.required, Validators.email]);
        this.passwordForm = new FormControl('', Validators.required);
        this.passwordCopyForm = new FormControl('', [Validators.required]);

        this.formGroup = this.formBuilder.group({
            usernameForm: this.usernameForm,
            emailForm: this.emailForm,
            passwordForm: this.passwordForm,
            passwordCopyForm: this.passwordCopyForm,
            recaptcha: ['', Validators.required],
        });
    }

    protected openAvatarSelector(): void {
        this.dialog.open(DialogBoxAvatarSelectorComponent, {
            width: '200px',
            height: '200px',
            backdropClass: 'dialog-backdrop',
            position: {
                left: this.selector._elementRef.nativeElement.offsetLeft + 200 + 'px',
                top: this.selector._elementRef.nativeElement.offsetTop - 50 - 28 + 'px',
            },
        });
    }
}
