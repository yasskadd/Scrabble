import { Component } from '@angular/core';
import { invoke } from '@tauri-apps/api/tauri';
import { ThemeService } from './services/theme.service';

@Component({
    selector: 'app-root',
    template: '',
    styles: [
        `
            .logo.angular:hover {
                filter: drop-shadow(0 0 2em #e32727);
            }
        `,
    ],
    standalone: true,
})
export class AppComponent {
    greetingMessage = '';
    isDarkTheme = false;

    constructor(private themeService: ThemeService) {
        this.themeService.isDarkTheme.subscribe((isDarkTheme) => {
            this.isDarkTheme = isDarkTheme;
        });
    }

    toggleTheme(): void {
        this.isDarkTheme = !this.isDarkTheme;
        this.themeService.setDarkTheme(this.isDarkTheme);
    }

    greet(name: string): void {
        invoke<string>('greet', { name }).then((text) => {
            this.greetingMessage = text;
        });
    }
}
