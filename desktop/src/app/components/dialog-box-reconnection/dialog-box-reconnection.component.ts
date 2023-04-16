import { Component } from '@angular/core';
import { LanguageService } from '@app/services/language.service';

@Component({
    selector: 'app-dialog-box-reconnection',
    templateUrl: './dialog-box-reconnection.component.html',
    styleUrls: ['./dialog-box-reconnection.component.scss'],
})
export class DialogBoxReconnectionComponent {
    constructor(protected languageService: LanguageService) {}
}
