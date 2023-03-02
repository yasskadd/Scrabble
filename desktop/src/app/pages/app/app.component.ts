import { ChangeDetectorRef, Component, ElementRef } from '@angular/core';
import { ClientSocketService } from '@app/services/communication/client-socket.service';
import { ThemeService } from '@services/theme.service';

// import * as tauri from '@tauri-apps/api';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent {
    constructor(
        private themeService: ThemeService,
        private clientSocketService: ClientSocketService,
        private changeDetector: ChangeDetectorRef,
        private elementRef: ElementRef,
    ) {
        this.clientSocketService.updateSubject.subscribe(() => {
            this.changeDetector.detectChanges();
        });
        this.themeService.isDarkTheme.subscribe((isDarkTheme: boolean) => {
            if (isDarkTheme) {
                this.elementRef.nativeElement.classList.add('darkMode');
            } else {
                this.elementRef.nativeElement.classList.remove('darkMode');
            }
        });
    }
}
