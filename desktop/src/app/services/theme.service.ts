import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { WebviewWindow } from '@tauri-apps/api/window';
import { TauriStateService } from '@services/tauri-state.service';

@Injectable({
    providedIn: 'root',
})
export class ThemeService {
    isDarkTheme: BehaviorSubject<boolean>;

    constructor(private tauriStateService: TauriStateService) {
        this.isDarkTheme = new BehaviorSubject<boolean>(false);

        if (this.tauriStateService.useTauri) {
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
