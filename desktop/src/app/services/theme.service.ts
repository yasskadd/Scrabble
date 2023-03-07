import { Injectable } from '@angular/core';
import { window } from '@tauri-apps/api';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ThemeService {
    isDarkTheme: BehaviorSubject<boolean>;

    constructor() {
        this.isDarkTheme = new BehaviorSubject<boolean>(false);

        console.log(window.WebviewWindow.getByLabel('main').theme);
        window.WebviewWindow.getByLabel('main').onThemeChanged(({ payload: theme }) => {
            console.log(theme);
        });
    }

    toggleDarkMode(): void {
        this.isDarkTheme.next(!this.isDarkTheme.value);
    }
}
