import { Component, NgZone } from '@angular/core';
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
        private ngZone: NgZone,
        private languageService: LanguageService,
        protected themeService: ThemeService,
    ) {
        this.isHomePage = this.checkIfHomePage();
    }

    checkIfHomePage() {
        return this.router.url.includes(AppRoutes.HomePage);
    }

    redirectHome() {
        if (!this.isGamePage()) {
            this.ngZone.run(() => {
                this.router.navigate([`${AppRoutes.HomePage}`]).then();
            });
        }
    }

    redirectProfilePage() {
        this.ngZone.run(() => {
            this.router.navigate(['/profile']).then();
        });
    }

    redirectSettingsPage() {
        this.ngZone.run(() => {
            this.router.navigate(['/settings']).then();
        });
    }

    redirectUserPage() {
        this.ngZone.run(() => {
            this.router.navigate(['/user']).then();
        });
    }

    redirectLoginPage() {
        this.ngZone.run(() => {
            this.router.navigate(['/login']).then();
        });
    }

    redirectAdmin() {
        this.isHomePage = false;
        this.ngZone.run(() => {
            this.router.navigate([`${AppRoutes.AdminPage}`]).then();
        });
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
