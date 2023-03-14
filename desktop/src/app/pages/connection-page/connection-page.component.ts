import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MAX_TEXT_LENGTH } from '@app/constants/user';
import { AppRoutes } from '@app/models/app-routes';
import { UserService } from '@app/services/user.service';
import { IUser } from '@common/interfaces/user';
import { Subject } from 'rxjs';

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

    constructor(private formBuilder: FormBuilder, private userService: UserService, private router: Router) {
        this.usernameForm = new FormControl('', [Validators.required, Validators.maxLength(MAX_TEXT_LENGTH)]);
        this.passwordForm = new FormControl('', [Validators.required, Validators.maxLength(MAX_TEXT_LENGTH)]);
        this.connectionError = '';

        this.formGroup = this.formBuilder.group({
            usernameForm: this.usernameForm,
            passwordForm: this.passwordForm,
        });
    }

    protected login(): void {
        const connectionSubject: Subject<string> = this.userService.login({
            username: this.usernameForm.value,
            password: this.passwordForm.value,
        } as IUser);
        connectionSubject.subscribe((res: string) => {
            if (res) {
                // TODO : Language
                this.connectionError = res;
                this.passwordForm.reset();
                return;
            }

            this.router.navigate([AppRoutes.HomePage]).then();
            connectionSubject.unsubscribe();
        });
    }
}
