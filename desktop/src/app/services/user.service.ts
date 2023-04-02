// import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AppRoutes } from '@app/models/app-routes';
import { AvatarData } from '@common/interfaces/avatar-data';
import { ImageInfo } from '@common/interfaces/image-info';
import { IUser } from '@common/interfaces/user';
import { ImageType } from '@common/models/image-type';
import { ClientSocketService } from '@services/communication/client-socket.service';
import { Subject } from 'rxjs';
import { AppCookieService } from './communication/app-cookie.service';
import { HttpHandlerService } from './communication/http-handler.service';

@Injectable({
    providedIn: 'root',
})
export class UserService {
    user: IUser;

    constructor(
        private httpHandlerService: HttpHandlerService,
        private clientSocketService: ClientSocketService,
        private cookieService: AppCookieService,
        private router: Router,
    ) {
        this.initUser();
    }

    isConnected(): boolean {
        return this.user.username && this.user.password ? true : false;
    }

    login(user: IUser): Subject<string> {
        const subject = new Subject<string>();

        this.httpHandlerService.login(user).then(
            (loginRes: { userData: IUser; sessionToken: string }) => {
                this.updateUserWithImageUrl(loginRes.userData);
                this.cookieService.updateUserSessionCookie(loginRes.sessionToken);
                subject.next('');
            },
            (error: any) => {
                console.log(error);

                // TODO : Language
                subject.next(error.error.message);
            },
        );

        return subject;
    }

    logout(): void {
        this.httpHandlerService.logout().then(() => {
            this.initUser();
            this.cookieService.removeSessionCookie();
            this.clientSocketService.disconnect();
            this.router.navigate([AppRoutes.ConnectionPage]).then();
        });
    }

    async submitNewProfilePic(avatarData: AvatarData): Promise<boolean> {
        return this.httpHandlerService
            .modifyProfilePicture(avatarData, this.avatarDataToImageInfo(avatarData).isDefaultPicture)
            .then((data: { userData: IUser }) => {
                if (data.userData) {
                    this.updateUserWithImageUrl(data.userData);
                    return true;
                }
                return false;
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

    private avatarDataToImageInfo(avatarData: AvatarData): ImageInfo {
        const isDefaultPicture = avatarData.type === ImageType.Url;
        let imageInfo: ImageInfo;
        if (isDefaultPicture) {
            imageInfo = {
                name: avatarData.name,
                isDefaultPicture,
                key: avatarData.url,
            };
        } else {
            imageInfo = {
                name: avatarData.name,
                isDefaultPicture,
            };
        }

        return imageInfo;
    }

    private updateUserWithImageUrl(user: IUser): void {
        if (user.profilePicture.isDefaultPicture) {
            this.httpHandlerService.getDefaultImages().then((map: Map<string, string[]>) => {
                // Set url in userData for local access to the default image
                // (yes we download all of the keys, but it's easier like that)
                Object.entries(map).forEach((entry: [string, string[]]) => {
                    if (entry[0] === user.profilePicture.name) {
                        user.profilePicture.key = entry[1][0];
                    }
                });
            });
        } else {
            this.httpHandlerService.getProfilePicture().then((res: { url: string }) => {
                // Set url in userData for local access to the image
                user.profilePicture.key = res.url;
            });
        }
        this.user = user;
    }
}
