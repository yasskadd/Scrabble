import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie';
import { ClientSocketService } from '@services/communication/client-socket.service';

@Injectable({
    providedIn: 'root',
})
export class AppCookieService {
    private userSessionCookie: string;

    constructor(private cookieService: CookieService, private clientSocketService: ClientSocketService) {}

    removeSessionCookie(): void {
        this.cookieService.remove('session_token');
    }

    updateUserSessionCookie(cookie?: string): void {
        if (!cookie) {
            this.userSessionCookie = this.cookieService.get('session_token');
        }
        console.log('connecting');
        console.log(this.userSessionCookie);
        this.clientSocketService.establishConnection(this.userSessionCookie).then();
    }
}
