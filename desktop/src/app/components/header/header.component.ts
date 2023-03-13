import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AppRoutes } from '@app/models/app-routes';
import { ThemeService } from '@services/theme.service';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
    // isHomePage: boolean;

    constructor(private router: Router, protected themeService: ThemeService) {
        //this.isHomePage = this.checkIfHomePage();
    }

    // checkIfHomePage() {
    //     return this.router.url.includes(AppRoutes.HomePage);
    // }

    redirectHome() {
        //this.isHomePage = true;
        this.router.navigate([AppRoutes.HomePage]).then();
    }

    // redirectAdmin() {
    //     this.isHomePage = false;
    //     this.router.navigate([AppRoutes.AdminPage]).then();
    // }
}

// TODO: removed commented code or implement home and admin button for authorised users
