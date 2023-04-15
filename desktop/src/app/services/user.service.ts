import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AppRoutes } from '@app/models/app-routes';
import { SocketEvents } from '@common/constants/socket-events';
import { AvatarData } from '@common/interfaces/avatar-data';
import { HistoryEvent } from '@common/interfaces/history-event';
import { ImageInfo } from '@common/interfaces/image-info';
import { IUser } from '@common/interfaces/user';
import { UserStats } from '@common/interfaces/user-stats';
import { ImageType } from '@common/models/image-type';
import { ClientSocketService } from '@services/communication/client-socket.service';
import { SnackBarService } from '@services/snack-bar.service';
import { BehaviorSubject } from 'rxjs';
import { AppCookieService } from './communication/app-cookie.service';
import { HttpHandlerService } from './communication/http-handler.service';

@Injectable({
    providedIn: 'root',
})
export class UserService {
    user: IUser;
    userStats: UserStats;
    userHistoryEvents: HistoryEvent[];
    isConnected: BehaviorSubject<boolean>;

    private tempUserData: IUser;

    constructor(
        private httpHandlerService: HttpHandlerService,
        private clientSocketService: ClientSocketService,
        private cookieService: AppCookieService,
        private snackBarService: SnackBarService,
        private router: Router,
    ) {
        this.user = undefined;
        this.userStats = undefined;
        this.userHistoryEvents = undefined;
        this.isConnected = new BehaviorSubject<boolean>(false);

        this.subscribeConnectionEvents();

        this.clientSocketService.reconnect.subscribe(() => {
            this.clientSocketService.reconnectionDialog = undefined;
            this.login(this.tempUserData);
        });
        this.clientSocketService.cancelConnection.subscribe(() => {
            this.clientSocketService.reconnectionDialog = undefined;
            this.logout();
        });
    }

    subscribeConnectionEvents(): void {
        this.clientSocketService.on(SocketEvents.SuccessfulConnection, () => {
            const switcher: IUser = JSON.parse(JSON.stringify(this.user));
            this.user = JSON.parse(JSON.stringify(this.tempUserData));
            this.tempUserData = switcher;

            // TODO : Language
            this.snackBarService.openInfo('Connection successful');
            this.updateUserWithImageUrl(this.user);
            this.isConnected.next(true);

            this.router.navigate([AppRoutes.HomePage]).then();
        });
        this.clientSocketService.on(SocketEvents.UserAlreadyConnected, () => {
            // TODO : Language
            this.snackBarService.openError('User already connected');
            this.logout().then();
        });
    }

    login(user: IUser): void {
        this.user = user;
        this.httpHandlerService.login(user).then(
            (loginRes: { userData: IUser; sessionToken: string }) => {
                this.tempUserData = loginRes.userData;
                this.cookieService.updateUserSessionCookie(loginRes.sessionToken).then();
            },
            () => {
                // TODO : Language
                this.isConnected.next(false);
                this.logout();
            },
        );
        this.setUserStats();
        console.log(this.userStats);
        // this.setUserHistoryEvents();
        // console.log(this.userHistoryEvents);
    }

    async logout(): Promise<void> {
        this.httpHandlerService.logout(this.user).then(async () => {
            this.user = undefined;
            this.tempUserData = undefined;

            this.cookieService.removeSessionCookie();
            await this.clientSocketService.disconnect();

            this.isConnected.next(false);
            this.router.navigate([AppRoutes.ConnectionPage]).then();
        });
    }

    setUserStats() {
        this.httpHandlerService.getStats().then((result) => {
            this.userStats = result;
        });
    }

    // setUserHistoryEvents() {
    //     this.httpHandlerService.getUserHistoryEvents().then((result) => {
    //         this.userHistoryEvents = result;
    //     });
    // }

    async submitNewProfilePic(avatarData: AvatarData): Promise<boolean> {
        return this.httpHandlerService
            .modifyProfilePicture(avatarData, this.avatarDataToImageInfo(avatarData).isDefaultPicture)
            .then((data: { userData: IUser }) => {
                if (data.userData) {
                    this.user = data.userData;
                    this.updateUserWithImageUrl(data.userData);
                    return true;
                }
                return false;
            });
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
