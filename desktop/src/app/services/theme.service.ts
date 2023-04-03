import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { useTauri } from '@app/pages/app/app.component';
import { WebviewWindow } from '@tauri-apps/api/window';

@Injectable({
    providedIn: 'root',
})
export class ThemeService {
    isDarkTheme: BehaviorSubject<boolean>;

    constructor() {
        this.isDarkTheme = new BehaviorSubject<boolean>(false);

        if (useTauri) {
            const tauriWindow = WebviewWindow.getByLabel('main');
            tauriWindow.theme().then((theme: string) => {
                this.isDarkTheme.next(theme === 'dark');
            });
            tauriWindow
                .onThemeChanged(({ payload: theme }) => {
                    this.isDarkTheme.next(theme === 'dark');
                })
                .then();
        }
    }

    toggleDarkMode(): void {
        this.isDarkTheme.next(!this.isDarkTheme.value);
    }
}
