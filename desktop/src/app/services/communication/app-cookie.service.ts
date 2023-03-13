import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class AppCookieService {
    // private userSessionCookie: string;

    constructor() {} // private cookieService: CookieService

    updateUserSessionCookie(): void {
        // this.userSessionCookie = this.cookieService.get('session_token');
    }
}
