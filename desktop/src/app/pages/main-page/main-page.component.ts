import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogBoxGameTypeComponent } from '@app/components/dialog-box-game-type/dialog-box-game-type.component';
import { DialogBoxHighScoresComponent } from '@app/components/dialog-box-high-scores/dialog-box-high-scores.component';
import { DialogGameHelpComponent } from '@app/components/dialog-game-help/dialog-game-help.component';
import { ChatboxHandlerService } from '@app/services/chat/chatbox-handler.service';
import { ClientSocketService } from '@app/services/communication/client-socket.service';

@Component({
    selector: 'app-main-page',
    templateUrl: './main-page.component.html',
    styleUrls: ['./main-page.component.scss'],
})
export class MainPageComponent {
    readonly title: string = "Bienvenue au Scrabble de l'équipe 107!";

    log2990Message =
        "Un mode qui regroupe toutes les beautés du Scrabble Classique avec l'ajout d'objectifs afin de rajouter une difficulté supplémentaire";
    private readonly dialogWidth: string = '500px';
    private readonly dialogWidthHighScore: string = '750px';

    constructor(
        protected chatSocketService: ChatboxHandlerService,
        protected clientSocketService: ClientSocketService,
        private dialog: MatDialog,
        private highScore: MatDialog,
    ) {}

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
        this.chatSocketService.submitMessage('test');
        console.log(this.chatSocketService.messages);
    }
}
