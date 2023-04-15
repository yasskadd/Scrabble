import { ChangeDetectorRef, Component, ElementRef, OnInit } from '@angular/core';
import { ClientSocketService } from '@app/services/communication/client-socket.service';
import { ThemeService } from '@services/theme.service';
import { AppCookieService } from '@services/communication/app-cookie.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
    constructor(
        private themeService: ThemeService,
        private clientSocketService: ClientSocketService,
        private cookieService: AppCookieService,
        private changeDetector: ChangeDetectorRef,
        private elementRef: ElementRef,
    ) {
        this.clientSocketService.appUpdate.subscribe(() => {
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

    ngOnInit() {
        this.cookieService.removeSessionCookie();
    }
}
