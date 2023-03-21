import { Injectable } from '@angular/core';
import { window as tauriWindow } from '@tauri-apps/api';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ThemeService {
    isDarkTheme: BehaviorSubject<boolean>;

    constructor() {
        this.isDarkTheme = new BehaviorSubject<boolean>(false);

        if (!!window.__TAURI_IPC__) {
            tauriWindow.WebviewWindow.getByLabel('main').onThemeChanged(({ payload: theme }) => {
                console.log(theme);
            });
        }
    }

    toggleDarkMode(): void {
        this.isDarkTheme.next(!this.isDarkTheme.value);
    }
}
