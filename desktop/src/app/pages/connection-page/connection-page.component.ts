import { Component, NgZone } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MAX_TEXT_LENGTH } from '@app/constants/user';
import { UserService } from '@app/services/user.service';
import { IUser } from '@common/interfaces/user';
import { HttpHandlerService } from '@services/communication/http-handler.service';
import { SnackBarService } from '@services/snack-bar.service';

@Component({
    selector: 'app-connection-page',
    templateUrl: './connection-page.component.html',
    styleUrls: ['./connection-page.component.scss'],
})
export class ConnectionPageComponent {
    protected formGroup: FormGroup;
    protected usernameForm: FormControl;
    protected passwordForm: FormControl;
    protected connectionError: string;

    constructor(
        private httpHandlerService: HttpHandlerService,
        private formBuilder: FormBuilder,
        private userService: UserService,
        private snackBarService: SnackBarService,
        private router: Router,
        private ngZone: NgZone,
    ) {
        this.usernameForm = new FormControl('', [Validators.required, Validators.maxLength(MAX_TEXT_LENGTH)]);
        this.passwordForm = new FormControl('', [Validators.required, Validators.maxLength(MAX_TEXT_LENGTH)]);
        this.connectionError = '';

        this.formGroup = this.formBuilder.group({
            usernameForm: this.usernameForm,
            passwordForm: this.passwordForm,
        });

        this.userService.isConnected.subscribe((connected: boolean) => {
            if (connected) {
                // TODO : Language
                // this.connectionError = res;
                this.passwordForm.reset();
                return;
            }
        });
    }

    protected login(): void {
        this.userService.login({
            _id: '',
            username: this.usernameForm.value,
            password: this.passwordForm.value,
        } as IUser);
    }

    protected redirectUserPage() {
        this.ngZone.run(() => {
            this.router.navigate(['/user']).then();
        });
    }

    protected redirectForgotPasswordPage() {
        console.log('CALLED');
        this.ngZone.run(() => {
            this.router.navigate(['/forgot-password']).then();
        });
    }

    protected forgot(): void {
        if (this.usernameForm.invalid) {
            this.snackBarService.openError('Please enter a valid username');
            return;
        }

        this.httpHandlerService.forgotPassword(this.usernameForm.value).then();
    }
}
