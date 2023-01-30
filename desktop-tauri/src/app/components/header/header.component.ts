import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
    readonly buttonText: string[];
    readonly homePage: string[] = ['A', 'C', 'C', 'U', 'E', 'I', 'L'];
    readonly adminPage: string[] = ['A', 'D', 'M', 'I', 'N'];
    constructor(private router: Router) {}

    redirectHome() {
        this.router.navigate(['/home']);
    }
    redirectAdmin() {
        this.router.navigate(['/admin']);
    }
}
