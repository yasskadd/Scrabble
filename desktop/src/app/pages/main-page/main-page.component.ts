import { Component, OnDestroy } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { DialogBoxGameTypeComponent } from '@app/components/dialog-box-game-type/dialog-box-game-type.component';
import { DialogBoxHighScoresComponent } from '@app/components/dialog-box-high-scores/dialog-box-high-scores.component';
import { DialogGameHelpComponent } from '@app/components/dialog-game-help/dialog-game-help.component';
import { SocketResponse } from '@app/interfaces/server-responses';
import { ChatboxHandlerService } from '@app/services/chat/chatbox-handler.service';
import { UserService } from '@app/services/user.service';
import { SocketEvents } from '@common/constants/socket-events';
import { Subject } from 'rxjs';
import { LanguageChoice } from '@app/models/language-choice';
import { LanguageService } from '@services/language.service';

@Component({
    selector: 'app-main-page',
    templateUrl: './main-page.component.html',
    styleUrls: ['./main-page.component.scss'],
})
export class MainPageComponent implements OnDestroy {
    readonly title: string = "Bienvenue au Scrabble de l'équipe 107!";

    protected userNameForm: FormControl;
    protected languageForm: FormControl;
    protected homeConnectionResponse: SocketResponse;
    protected connectionSubject: Subject<SocketResponse>;
    protected disconnectionSubject: Subject<void>;

    protected chatIsOpen: boolean;
    protected languageChoices: typeof LanguageChoice = LanguageChoice;

    private readonly dialogWidth: string = '500px';
    private readonly dialogWidthHighScore: string = '750px';

    constructor(
        protected chatBoxHandlerService: ChatboxHandlerService,
        protected userService: UserService,
        protected languageService: LanguageService,
        private dialog: MatDialog,
        private highScore: MatDialog,
    ) {
        this.homeConnectionResponse = { validity: false };
        this.userNameForm = new FormControl('', Validators.required);
        this.languageForm = new FormControl('fr', Validators.required);
        this.chatIsOpen = false;

        this.subscribeConnectionEvents();
        this.languageForm.valueChanges.subscribe((value: string) => {
            this.languageService.setLanguage(value as LanguageChoice);
        });
    }

    protected get loggedIn(): boolean {
        return this.chatBoxHandlerService.loggedIn;
    }

    ngOnDestroy() {
        this.connectionSubject.unsubscribe();
        this.disconnectionSubject.unsubscribe();
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
            disableClose: true,
        });
    }

    openHelpDialog(): void {
        this.dialog.open(DialogGameHelpComponent, { width: '50%' });
    }

    sendMessage(): void {
        this.chatBoxHandlerService.submitMessage('test');
    }

    logIn(): void {
        if (this.chatBoxHandlerService.loggedIn) return;
        this.userNameForm.markAsTouched();

        this.userService.userName = this.userNameForm.value;
        this.chatBoxHandlerService.joinHomeRoom(this.userService.userName);
    }

    logOut(): void {
        this.chatBoxHandlerService.leaveHomeRoom(this.userService.userName);
    }

    getErrorMessage(): string {
        let message = '';
        switch (this.homeConnectionResponse.socketMessage) {
            case SocketEvents.UsernameTaken: {
                this.languageService.getWord('error.connection.usernameAlreadyExists').subscribe((word: string) => {
                    message = word;
                });
                break;
            }
            case SocketEvents.RoomIsFull: {
                this.languageService.getWord('error.connection.roomFull').subscribe((word: string) => {
                    message = word;
                });
                break;
            }
        }

        if (this.userNameForm.hasError('required')) {
            this.languageService.getWord('error.connection.empty').subscribe((word: string) => {
                message = word;
            });
        }

        return message;
    }

    openChat() {
        this.chatIsOpen = true;
    }

    closeChat() {
        this.chatIsOpen = false;
    }

    private subscribeConnectionEvents(): void {
        this.connectionSubject = this.chatBoxHandlerService.subscribeToUserConnection();
        this.connectionSubject.subscribe((res: SocketResponse) => {
            this.homeConnectionResponse = res;
            if (!res.validity) {
                this.userNameForm.setErrors({ notMatched: true });
            }
        });

        this.disconnectionSubject = this.chatBoxHandlerService.subscribeToUserDisconnecting();
        this.disconnectionSubject.subscribe(() => {
            this.userService.userName = '';
            this.userNameForm.setValue('');
        });
    }
}
