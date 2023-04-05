import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AppRoutes } from '@app/models/app-routes';
import { LanguageService } from '@app/services/language.service';
import { ThemeService } from '@app/services/theme.service';
import { UserService } from '@app/services/user.service';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
    isHomePage: boolean;
    constructor(
        protected userService: UserService,
        private router: Router,
        private languageService: LanguageService,
        protected themeService: ThemeService,
    ) {
        this.isHomePage = this.checkIfHomePage();
    }

    checkIfHomePage() {
        return this.router.url.includes(AppRoutes.HomePage);
    }

    redirectHome() {
        // this.isHomePage = true;
        this.router.navigate([`${AppRoutes.HomePage}`]).then();
    }

    redirectSettingsPage() {
        this.router.navigate(['/settings']).then();
    }

    redirectUserPage() {
        this.router.navigate(['/user']).then();
    }

    redirectLoginPage() {
        this.router.navigate(['/login']).then();
    }

    redirectAdmin() {
        this.isHomePage = false;
        this.router.navigate([`${AppRoutes.AdminPage}`]).then();
    }

    getLetters(translation: string): string[] {
        const letters: string[] = [];
        this.languageService.getWord(translation).subscribe((word: string) => {
            for (let i = 0; i < word.length; i++) {
                letters.push(word.charAt(i));
            }
        });

        return letters;
    }

    isGamePage() {
        return this.router.url.includes(AppRoutes.GamePage);
    }
}

// TODO: removed commented code or implement home and admin button for authorised users
