import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IUser } from '@common/interfaces/user';
import { Subject, Subscription } from 'rxjs';
import { AppCookieService } from './communication/app-cookie.service';
import { HttpHandlerService } from './communication/http-handler.service';
import { AvatarData } from '@common/interfaces/avatar-data';
import { ImageInfo } from '@common/interfaces/image-info';
import { ImageType } from '@common/models/image-type';

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
                this.updateUserWithImageUrl(loginRes.userData);
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

    submitNewProfilePic(avatarData: AvatarData): Subscription {
        return this.httpHandlerService
            .modifyProfilePicture(avatarData, this.avatarDataToImageInfo(avatarData).isDefaultPicture)
            .subscribe((data: { userData: IUser }) => {
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
            this.httpHandlerService.getDefaultImages().subscribe((map: Map<string, string[]>) => {
                // Set url in userData for local access to the default image
                // (yes we download all of the keys, but it's easier like that)
                Object.entries(map).forEach((entry: [string, string[]]) => {
                    if (entry[0] === user.profilePicture.name) {
                        user.profilePicture.key = entry[1][0];
                    }
                });
            });
        } else {
            this.httpHandlerService.getProfilePicture().subscribe((res: { url: string }) => {
                // Set url in userData for local access to the image
                user.profilePicture.key = res.url;
            });
        }
        this.user = user;
    }
}
