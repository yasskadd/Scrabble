import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AppRoutes } from '@app/models/app-routes';
import { LanguageChoice } from '@app/models/language-choice';
import { RustEvent } from '@app/models/rust-command';
import { SocketEvents } from '@common/constants/socket-events';
import { AvatarData } from '@common/interfaces/avatar-data';
import { ImageInfo } from '@common/interfaces/image-info';
import { RoomPlayer } from '@common/interfaces/room-player';
import { IUser } from '@common/interfaces/user';
import { ImageType } from '@common/models/image-type';
import { PlayerType } from '@common/models/player-type';
import { ClientSocketService } from '@services/communication/client-socket.service';
import { SnackBarService } from '@services/snack-bar.service';
import * as tauri from '@tauri-apps/api';
import { WebviewWindowHandle } from '@tauri-apps/api/window';
import { BehaviorSubject } from 'rxjs';
import { AppCookieService } from './communication/app-cookie.service';
import { HttpHandlerService } from './communication/http-handler.service';
import { LanguageService } from './language.service';

@Injectable({
    providedIn: 'root',
})
export class UserService {
    user: IUser;
    isConnected: BehaviorSubject<boolean>;

    private tempUserData: IUser;
    public botImageUrl: string;

    constructor(
        private httpHandlerService: HttpHandlerService,
        private clientSocketService: ClientSocketService,
        private cookieService: AppCookieService,
        private snackBarService: SnackBarService,
        private router: Router,
        private ngZone: NgZone,
        private languageService: LanguageService,
    ) {
        this.user = undefined;
        this.isConnected = new BehaviorSubject<boolean>(false);

        this.subscribeConnectionEvents();

        this.clientSocketService.reconnect.subscribe(() => {
            this.clientSocketService.reconnectionDialog = undefined;
            this.login(this.tempUserData);
        });
        this.clientSocketService.cancelConnection.subscribe(() => {
            this.clientSocketService.reconnectionDialog = undefined;
            this.logout().then();
        });
        this.initBotImage().then();
    }

    login(user: IUser): void {
        this.user = user;
        this.httpHandlerService.login(user).then(
            (loginRes: { userData: IUser; sessionToken: string }) => {
                if (!loginRes.sessionToken) {
                    // TODO : Language
                    this.snackBarService.openError('Connection failed');
                    return;
                }
                this.tempUserData = loginRes.userData;
                this.cookieService.updateUserSessionCookie(loginRes.sessionToken).then();
            },
            () => {
                // TODO : Language
                this.isConnected.next(false);
                this.logout().then();
            },
        );
    }

    async logout(): Promise<void> {
        this.httpHandlerService.logout().then(async () => {
            this.user = undefined;
            this.tempUserData = undefined;

            this.cookieService.removeSessionCookie();
            await this.clientSocketService.disconnect();

            this.isConnected.next(false);
            if (tauri.window.getCurrent().label === 'chat') return;
            this.ngZone.run(() => {
                this.router.navigate([AppRoutes.ConnectionPage]).then();
            });
        });
    }

    subscribeConnectionEvents(): void {
        this.clientSocketService.on(SocketEvents.SuccessfulConnection, () => {
            if (tauri.window.getCurrent().label === 'main') {
                const switcher: IUser = JSON.parse(JSON.stringify(this.user));
                this.user = JSON.parse(JSON.stringify(this.tempUserData));
                this.tempUserData = switcher;

                this.languageService.getWord('auth.login.success').subscribe((word: string) => {
                    this.snackBarService.openInfo(word);
                });
                this.updateUserWithImageUrl(this.user);
                if (tauri.window.getAll().filter((webView: WebviewWindowHandle) => webView.label === 'chat').length !== 0) {
                    const chatWindow = new WebviewWindowHandle('chat');
                    chatWindow.emit(RustEvent.UserData, this.user).then();
                }
            }
            this.isConnected.next(true);
            this.languageService.setLanguage(this.user.language as LanguageChoice);

            if (tauri.window.getCurrent().label === 'chat') return;
            this.ngZone.run(() => {
                this.router.navigate([AppRoutes.HomePage]).then();
            });
        });
        this.clientSocketService.on(SocketEvents.UserAlreadyConnected, () => {
            this.languageService.getWord('auth.login.user_taken').subscribe((word: string) => {
                this.snackBarService.openInfo(word);
            });
            this.logout().then();
        });
    }

    getUser(): IUser {
        return this.user;
    }

    getPlayerImage(player: RoomPlayer): string {
        if (player.type === PlayerType.Bot) {
            return this.botImageUrl;
        }

        return player.user.profilePicture.key;
    }

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

    private async initBotImage(): Promise<void> {
        await this.httpHandlerService.getBotImage().then((res) => {
            this.botImageUrl = res.url;
        });
    }
}
