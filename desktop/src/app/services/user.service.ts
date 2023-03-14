import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IUser } from '@common/interfaces/user';
import { Subject } from 'rxjs';
import { AppCookieService } from './communication/app-cookie.service';
import { HttpHandlerService } from './communication/http-handler.service';

@Injectable({
    providedIn: 'root',
})
export class UserService {
    user: IUser;
    userName: string;

    constructor(private httpHandlerService: HttpHandlerService, private cookieService: AppCookieService) {
        this.initUser();
    }

    isConnected(): boolean {
        return this.user.username && this.user.password ? true : false;
    }

    login(user: IUser): Subject<string> {
        const subject = new Subject<string>();

        // TODO : Also get image data from server
        this.httpHandlerService.login(user).subscribe({
            next: () => {
                this.cookieService.updateUserSessionCookie();
                this.user = user;
                subject.next('');
            },
            error: (error: HttpErrorResponse) => {
                // TODO : Language
                subject.next(error.error.message);
            },
        });

        return subject;
    }

    logout(): void {
        this.httpHandlerService.logout().subscribe(() => {
            this.initUser();
        });
    }

    private initUser(): void {
        this.user = {
            email: '',
            username: '',
            password: '',
            profilePicture: undefined,
        };
    }
}
