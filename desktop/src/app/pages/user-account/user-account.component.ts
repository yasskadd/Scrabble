import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
    selector: 'app-user-account',
    templateUrl: './user-account.component.html',
    styleUrls: ['./user-account.component.scss'],
})
export class UserAccountComponent {
    readonly siteKey: string = '6Lf7L98kAAAAAJolI_AENbQSq32e_Wcv5dYBQA6D';

    formGroup: FormGroup;
    usernameForm: FormControl;
    emailForm: FormControl;
    passwordForm: FormControl;
    passwordCopyForm: FormControl;

    constructor(private formBuilder: FormBuilder) {
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
}
