import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { LanguageChoice } from '@app/models/language-choice';
import { LanguageService } from '@app/services/language.service';
import { ThemeService } from '@app/services/theme.service';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {
    protected languageForm: FormControl;
    protected languageChoices: typeof LanguageChoice = LanguageChoice;

    constructor(private languageService: LanguageService, protected themeService: ThemeService) {
        this.languageForm = new FormControl(this.languageService.language, Validators.required);
        this.languageForm.valueChanges.subscribe((value: string) => {
            this.languageService.setLanguage(value as LanguageChoice);
        });
    }
}
