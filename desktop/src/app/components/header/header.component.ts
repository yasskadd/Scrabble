import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AppRoutes } from '@app/models/app-routes';
import { LanguageService } from '@app/services/language.service';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
    // TODO : Language
    readonly homePage: string[] = ['A', 'C', 'C', 'U', 'E', 'I', 'L'];
    readonly adminPage: string[] = ['A', 'D', 'M', 'I', 'N'];

    isHomePage: boolean;

    constructor(private languageService: LanguageService, private router: Router) {
        this.isHomePage = this.checkIfHomePage();
    }

    checkIfHomePage() {
        return this.router.url === AppRoutes.HomePage;
    }

    redirectHome() {
        this.isHomePage = true;
        this.router.navigate([AppRoutes.HomePage]).then();
    }

    redirectAdmin() {
        this.isHomePage = false;
        this.router.navigate([AppRoutes.AdminPage]).then();
    }

    getWelcomeLetters(): string[] {
        const welcomeLetters: string[] = [];
        this.languageService.getWord('header.welcome').subscribe((word: string) => {
            for (let i = 0; i < word.length; i++) {
                welcomeLetters.push(word.charAt(i));
            }
        });

        return welcomeLetters;
    }
}
