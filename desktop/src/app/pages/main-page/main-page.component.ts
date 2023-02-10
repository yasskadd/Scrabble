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

@Component({
    selector: 'app-main-page',
    templateUrl: './main-page.component.html',
    styleUrls: ['./main-page.component.scss'],
})
export class MainPageComponent implements OnDestroy {
    readonly title: string = "Bienvenue au Scrabble de l'équipe 107!";

    protected userNameForm: FormControl;
    protected loggedIn: boolean;
    protected homeConnectionResponse: SocketResponse;
    protected connectionSubject: Subject<SocketResponse>;
    protected disconnectionSubject: Subject<void>;

    private readonly dialogWidth: string = '500px';
    private readonly dialogWidthHighScore: string = '750px';

    constructor(
        protected chatBoxHandlerService: ChatboxHandlerService,
        protected userService: UserService,
        private dialog: MatDialog,
        private highScore: MatDialog,
    ) {
        this.homeConnectionResponse = { validity: false };
        this.loggedIn = false;
        this.userNameForm = new FormControl('', Validators.required);

        this.connectionSubject = this.chatBoxHandlerService.subscribeToUserConnection();
        this.connectionSubject.subscribe((res: SocketResponse) => {
            this.homeConnectionResponse = res;
            this.loggedIn = res.validity;
        });

        this.disconnectionSubject = this.chatBoxHandlerService.subscribeToUserDisconnecting();
        this.disconnectionSubject.subscribe(() => {
            this.loggedIn = false;
            this.userService.userName = '';
            this.userNameForm.setValue('');
        });
    }

    ngOnDestroy() {
        this.connectionSubject.unsubscribe();
        this.disconnectionSubject.unsubscribe();
    }

    openDialog(gameModeValue: string): void {
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
        console.log(this.chatBoxHandlerService.messages);
    }

    logIn(): void {
        this.userService.userName = this.userNameForm.value;
        this.userNameForm.setValue('');
        this.chatBoxHandlerService.joinHomeRoom(this.userService.userName);
    }

    logOut(): void {
        this.chatBoxHandlerService.leaveHomeRoom(this.userService.userName);
    }

    getErrorMessage(): string {
        switch (this.homeConnectionResponse.socketMessage) {
            case SocketEvents.UsernameTaken:
                return "Le nom d'utilisateur existe déjà";
            case SocketEvents.RoomIsFull:
                return 'Impossible de se connecter à la salle';
            default:
                return 'Erreur';
        }

        if (this.userNameForm.invalid) {
            return 'Le nom ne peut pas être vide';
        }
    }
}
