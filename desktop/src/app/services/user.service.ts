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
import { SocketEvents } from '@common/constants/socket-events';
import { SnackBarService } from '@services/snack-bar.service';

@Injectable({
    providedIn: 'root',
})
export class UserService {
    user: IUser;

    constructor(
        private httpHandlerService: HttpHandlerService,
        private clientSocketService: ClientSocketService,
        private cookieService: AppCookieService,
        private snackBarService: SnackBarService,
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
                console.log(this.user._id);
                this.clientSocketService.on(SocketEvents.UserAlreadyConnected, async () => {
                    // TODO : Language
                    this.snackBarService.openError('User already connected');
                    await this.logout();
                });

                this.cookieService.updateUserSessionCookie(loginRes.sessionToken).then(() => {
                    this.user = loginRes.userData;
                    // TODO : Language
                    this.snackBarService.openInfo('Connection successful');
                    this.updateUserWithImageUrl(loginRes.userData);
                    subject.next('');
                });
            },
            (error: any) => {
                // TODO : Language
                subject.next(error.error.message);
            },
        );

        return subject;
    }

    async logout(): Promise<void> {
        this.httpHandlerService.logout(this.user).then(async () => {
            this.initUser();
            this.cookieService.removeSessionCookie();
            await this.clientSocketService.disconnect();
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
            _id: '',
            email: '',
            username: '',
            password: '',
            profilePicture: undefined,
            historyEventList: [],
            language: 'fr', // TODO: To change if necessary
            theme: null, // TODO: to change
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
    }
}
