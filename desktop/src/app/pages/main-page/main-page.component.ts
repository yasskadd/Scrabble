import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DialogBoxGameTypeComponent } from '@app/components/dialog-box-game-type/dialog-box-game-type.component';
import { DialogBoxHighScoresComponent } from '@app/components/dialog-box-high-scores/dialog-box-high-scores.component';
import { DialogGameHelpComponent } from '@app/components/dialog-game-help/dialog-game-help.component';
import { SocketResponse } from '@app/interfaces/server-responses';
import { AppRoutes } from '@app/models/app-routes';
import { UserService } from '@app/services/user.service';
import { SocketEvents } from '@common/constants/socket-events';
import { GameMode } from '@common/models/game-mode';
import { ClientSocketService } from '@services/communication/client-socket.service';
import { LanguageService } from '@services/language.service';
import * as tauri from '@tauri-apps/api';

@Component({
    selector: 'app-main-page',
    templateUrl: './main-page.component.html',
    styleUrls: ['./main-page.component.scss'],
})
export class MainPageComponent {
    protected userNameForm: FormControl;
    protected homeConnectionResponse: SocketResponse;
    protected multiplayerCreateLink: string;

    protected chatIsOpen: boolean;

    private readonly dialogWidth: string = '500px';
    private readonly dialogWidthHighScore: string = '750px';

    constructor(
        protected userService: UserService,
        protected languageService: LanguageService,
        private clientSocketService: ClientSocketService,
        private dialog: MatDialog,
        private highScore: MatDialog,
        private router: Router,
    ) {
        this.multiplayerCreateLink = `/${AppRoutes.MultiGameCreationPage}/${GameMode.Multi}`;
        if (!this.userService.isConnected.getValue()) {
            if (tauri.window.getCurrent().label === 'chat') return;
            this.router.navigate([`${AppRoutes.ConnectionPage}`]).then();
        }

        this.homeConnectionResponse = { validity: false };
        this.userNameForm = new FormControl('', Validators.required);
        this.chatIsOpen = false;
    }

    protected get loggedIn(): boolean {
        return this.userService.isConnected.getValue();
    }

    openGameTypeDialog(gameModeValue: string): void {
        this.dialog.open(DialogBoxGameTypeComponent, {
            width: this.dialogWidth,
            data: gameModeValue,
        });
    }

    openHighScoreDialog(): void {
        this.highScore.open(DialogBoxHighScoresComponent, {
            width: this.dialogWidthHighScore,
            panelClass: 'highScoreComponent',
        });
    }

    openHelpDialog(): void {
        this.dialog.open(DialogGameHelpComponent, { width: '50%' });
    }

    // TODO : should be in a log-in component
    // logIn(): void {
    //     if (this.chatBoxHandlerService.loggedIn) return;
    //     this.userNameForm.markAsTouched();

    //     this.userService.user.username = this.userNameForm.value;
    //     this.chatBoxHandlerService.joinHomeRoom(this.userService.user.username);
    // }

    // // TODO : should be in a log-in component
    // logOut(): void {
    //     this.chatBoxHandlerService.leaveHomeRoom(this.userService.user.username);
    // }

    // TODO : should be in a log-in component
    // getErrorMessage(): string {
    //     let message = '';
    //     switch (this.homeConnectionResponse.socketMessage) {
    //         case SocketEvents.UsernameTaken: {
    //             this.languageService.getWord('error.connection.usernameAlreadyExists').subscribe((word: string) => {
    //                 message = word;
    //             });
    //             break;
    //         }
    //         case SocketEvents.RoomIsFull: {
    //             this.languageService.getWord('error.connection.roomFull').subscribe((word: string) => {
    //                 message = word;
    //             });
    //             break;
    //         }
    //     }

    //     if (this.userNameForm.hasError('required')) {
    //         this.languageService.getWord('error.connection.empty').subscribe((word: string) => {
    //             message = word;
    //         });
    //     }

    //     return message;
    // }

    openChat() {
        this.chatIsOpen = true;
    }

    closeChat() {
        this.chatIsOpen = false;
    }

    navigateJoinPage() {
        this.clientSocketService.send(SocketEvents.UpdateGameRooms);
        this.router.navigate([`/${AppRoutes.MultiJoinPage}/classique`]);
    }
}
