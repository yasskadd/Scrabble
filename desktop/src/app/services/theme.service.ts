import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ThemeService {
    isDarkTheme: BehaviorSubject<boolean>;

    constructor() {
        this.isDarkTheme = new BehaviorSubject<boolean>(false);

        // eslint-disable-next-line no-underscore-dangle
        if (window.__TAURI_IPC__) {
            // tauriWindow.WebviewWindow.getByLabel('main').onThemeChanged(({ payload: theme }) => {
            // console.log(theme);
            // });
        }
    }

    toggleDarkMode(): void {
        this.isDarkTheme.next(!this.isDarkTheme.value);
    }
}
