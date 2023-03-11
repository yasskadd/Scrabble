import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AppRoutes } from '@app/models/app-routes';
import { LanguageChoice } from '@app/models/language-choice';
import { LanguageService } from '@app/services/language.service';
import { UserService } from '@app/services/user.service';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
    isHomePage: boolean;

    protected languageForm: FormControl;
    protected languageChoices: typeof LanguageChoice = LanguageChoice;

    constructor(protected userService: UserService, private languageService: LanguageService, private router: Router) {
        this.isHomePage = this.checkIfHomePage();

        this.languageForm = new FormControl(this.languageService.language, Validators.required);
        this.languageForm.valueChanges.subscribe((value: string) => {
            this.languageService.setLanguage(value as LanguageChoice);
        });
    }

    checkIfHomePage() {
        return this.router.url.includes(AppRoutes.HomePage);
    }

    redirectHome() {
        this.isHomePage = true;
        this.router.navigate([AppRoutes.HomePage]).then();
    }

    redirectSettingsPage() {
        this.router.navigate(['/settings']);
    }

    redirectUserPage() {
        this.router.navigate(['/user']);
    }

    redirectLoginPage() {
        this.router.navigate(['/login']);
    }

    redirectAdmin() {
        this.isHomePage = false;
        this.router.navigate([AppRoutes.AdminPage]).then();
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
}
