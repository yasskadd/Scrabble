import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AppRoutes } from '@app/models/app-routes';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
    readonly homePage: string[] = ['A', 'C', 'C', 'U', 'E', 'I', 'L'];
    readonly adminPage: string[] = ['A', 'D', 'M', 'I', 'N'];
    isHomePage: boolean;
    isDarkMode: boolean;

    constructor(private router: Router) {
        this.isHomePage = this.checkIfHomePage();
        this.isDarkMode = false; // TODO : change on theme service is linked to client
    }

    checkIfHomePage() {
        return this.router.url === AppRoutes.HomePage;
    }

    toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        this.setDarkMode();
    }

    setDarkMode() {} // TODO : implement

    redirectHome() {
        this.isHomePage = true;
        this.router.navigate([AppRoutes.HomePage]).then();
    }

    redirectAdmin() {
        this.isHomePage = false;
        this.router.navigate([AppRoutes.AdminPage]).then();
    }
}
