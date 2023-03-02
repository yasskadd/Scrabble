import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
    selector: 'app-user-account',
    templateUrl: './user-account.component.html',
    styleUrls: ['./user-account.component.scss'],
})
export class UserAccountComponent {
    form: FormGroup = new FormGroup({
        tel: new FormControl(),
    });
}
