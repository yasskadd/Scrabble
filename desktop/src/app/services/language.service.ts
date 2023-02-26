import { Injectable } from '@angular/core';
import { LanguageChoice } from '@app/models/language-choice';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class LanguageService {
    constructor(private translateService: TranslateService) {
        this.translateService.setDefaultLang('fr');
        this.translateService.use('fr');
    }

    setLanguage(choice: LanguageChoice): void {
        this.translateService.use(choice.toString());
    }

    getWord(selector: string): Observable<string> {
        return this.translateService.get(selector);
    }
}
