import { Injectable } from '@angular/core';
import { TauriStateService } from '@services/tauri-state.service';
import { WebviewWindow } from '@tauri-apps/api/window';
import { BehaviorSubject } from 'rxjs';
import { UserService } from './user.service';

@Injectable({
    providedIn: 'root',
})
export class ThemeService {
    isDarkTheme: BehaviorSubject<boolean>;

    constructor(private tauriStateService: TauriStateService, private userService: UserService) {
        this.isDarkTheme = new BehaviorSubject<boolean>(false);

        if (this.tauriStateService.useTauri) {
            const tauriWindow = WebviewWindow.getByLabel('main');
            tauriWindow.theme().then((theme: string) => {
                this.isDarkTheme.next(theme === 'dark');
            });
            tauriWindow
                .onThemeChanged(({ payload: theme }) => {
                    if (this.userService.user !== undefined && this.userService.user.theme.isDynamic === true)
                        this.isDarkTheme.next(theme === 'dark');
                })
                .then();
        }

        this.userService.isConnected.subscribe((connected: boolean) => {
            if (connected) {
                this.isDarkTheme.next(this.userService.user.theme?.mainTheme === 'setting.dark');
            }
        });
    }

    async setDynamic(): Promise<void> {
        this.isDarkTheme.next((await WebviewWindow.getByLabel('main').theme()) === 'dark');
    }

    toggleDarkMode(): void {
        this.isDarkTheme.next(!this.isDarkTheme.value);
    }
}
