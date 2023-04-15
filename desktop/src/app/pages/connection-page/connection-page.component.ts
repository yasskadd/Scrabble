import { Component } from '@angular/core';
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
        this.router.navigate(['/user']).then();
    }

    protected forgot(): void {
        if (this.usernameForm.invalid) {
            this.snackBarService.openError('Please enter a valid username');
            return;
        }

        this.httpHandlerService.forgotPassword(this.usernameForm.value).then();
    }
}
