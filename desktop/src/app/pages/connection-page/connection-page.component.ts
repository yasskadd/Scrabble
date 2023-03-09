import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AppRoutes } from '@app/models/app-routes';
import { UserService } from '@app/services/user.service';
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
        this.usernameForm = new FormControl('', Validators.required);
        this.passwordForm = new FormControl('', Validators.required);
        this.connectionError = '';

        this.formGroup = this.formBuilder.group({
            usernameForm: this.usernameForm,
            passwordForm: this.passwordForm,
        });
    }

    protected connect(): void {
        const connectionSubject: Subject<string> = this.userService.connect({ username: this.usernameForm.value, password: this.passwordForm.value });
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
