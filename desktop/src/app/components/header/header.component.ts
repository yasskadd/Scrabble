import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
    readonly homePage: string[] = ['A', 'C', 'C', 'U', 'E', 'I', 'L'];
    readonly adminPage: string[] = ['A', 'D', 'M', 'I', 'N'];
    isHomePage: boolean;

    constructor(private router: Router) {
        this.isHomePage = this.checkIfHomePage();
    }

    checkIfHomePage() {
        return this.router.url === `/home`;
    }

    redirectHome() {
        this.isHomePage = true;
        this.router.navigate(['/home']);
        console.log(this.isHomePage);
    }

    redirectAdmin() {
        this.isHomePage = false;
        this.router.navigate(['/admin']);
        console.log(this.isHomePage);
    }
}
