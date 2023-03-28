import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie';
import { ClientSocketService } from '@services/communication/client-socket.service';

@Injectable({
    providedIn: 'root',
})
export class AppCookieService {
    userSessionCookie: string;

    constructor(private cookieService: CookieService, private clientSocketService: ClientSocketService) {}

    removeSessionCookie(): void {
        this.cookieService.remove('session_token');
    }

    updateUserSessionCookie(cookie?: string): void {
        this.userSessionCookie = cookie ? cookie : this.cookieService.get('session_token');
        this.clientSocketService.establishConnection(this.userSessionCookie).then();
    }
}
