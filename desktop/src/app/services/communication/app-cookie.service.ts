import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie';

@Injectable({
    providedIn: 'root',
})
export class AppCookieService {
    private userSessionCookie: string;

    constructor(private cookieService: CookieService) {}

    updateUserSessionCookie(): void {
        this.userSessionCookie = this.cookieService.get('session_token');
        console.log(this.userSessionCookie);
    }
}
