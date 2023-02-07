import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
    buttonText: string[];
    readonly homePage: string[] = ['A', 'C', 'C', 'U', 'E', 'I', 'L'];
    readonly adminPage: string[] = ['A', 'D', 'M', 'I', 'N'];
    constructor(private router: Router) {}

    redirectHome() {
        this.router.navigate(['/home']);
        this.buttonText = this.adminPage;
    }

    redirectAdmin() {
        this.router.navigate(['/admin']);
        this.buttonText = this.homePage;
    }
}
