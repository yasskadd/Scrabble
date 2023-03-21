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

    constructor(private httpHandlerService: HttpHandlerService, private cookieService: AppCookieService) {
        this.initUser();
    }

    isConnected(): boolean {
        return this.user.username && this.user.password ? true : false;
    }

    login(user: IUser): Subject<string> {
        const subject = new Subject<string>();

        this.httpHandlerService.login(user).subscribe({
            next: (loginRes: { userData: IUser }) => {
                if (loginRes.userData.profilePicture.isDefaultPicture) {
                    this.httpHandlerService.getDefaultImages().subscribe((map: Map<string, string[]>) => {
                        // Set url in userData for local access to the default image
                        // (yes we download all of the keys, but it's easier like that)
                        Object.entries(map).forEach((entry: [string, string[]]) => {
                            if (entry[0] === loginRes.userData.profilePicture.name) {
                                loginRes.userData.profilePicture.key = entry[1][0];
                            }
                        });
                    });
                } else {
                    this.httpHandlerService.getProfilePicture().subscribe((res: { url: string }) => {
                        // Set url in userData for local access to the image
                        loginRes.userData.profilePicture.key = res.url;
                    });
                }
                this.user = loginRes.userData;

                this.cookieService.updateUserSessionCookie();
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
