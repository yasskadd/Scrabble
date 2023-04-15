import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DialogBoxAbandonGameComponent } from '@app/components/dialog-box-abandon-game/dialog-box-abandon-game.component';
import { DialogGameHelpComponent } from '@app/components/dialog-game-help/dialog-game-help.component';
import { AppRoutes } from '@app/models/app-routes';
import { GameClientService } from '@app/services/game-client.service';
import { PlayerInformation } from '@common/interfaces/player-information';
import { TimeService } from '@services/time.service';
import { LetterPlacementService } from '@services/letter-placement.service';
import { ClientSocketService } from '@services/communication/client-socket.service';
import { SocketEvents } from '@common/constants/socket-events';

@Component({
    selector: 'app-information-panel',
    templateUrl: './information-panel.component.html',
    styleUrls: ['./information-panel.component.scss'],
})
export class InformationPanelComponent {
    private clueIndex: number;

    constructor(
        public gameClientService: GameClientService,
        protected letterService: LetterPlacementService,
        private clientSocketService: ClientSocketService,
        public timer: TimeService,
        private dialog: MatDialog,
        private router: Router,
    ) {
        this.clueIndex = -1;
    }

    get players(): PlayerInformation[] {
        return this.gameClientService.players;
    }

    abandonGame(): void {
        this.dialog.open(DialogBoxAbandonGameComponent, {
            width: 'auto',
            panelClass: 'abandonDialogComponent',
            disableClose: true,
        });
    }

    leaveGame(): void {
        this.gameClientService.quitGame();
        this.router.navigate([AppRoutes.HomePage]).then();
    }

    openHelpDialog() {
        this.dialog.open(DialogGameHelpComponent, { width: '50%' });
    }

    clueAvailable(): boolean {
        if (this.letterService.clueWords.length !== 0) {
            if (this.clueIndex === -1) {
                this.clueIndex = 0;
                this.letterService.showClueWord(this.clueIndex);
            }

            return true;
        }

        return false;
    }

    askForClue(): void {
        this.clientSocketService.send(SocketEvents.ClueCommand);
    }

    nextClue(): void {
        this.letterService.removeClue(this.clueIndex);
        this.clueIndex = (this.clueIndex + 1) % this.letterService.clueWords.length;
        this.letterService.showClueWord(this.clueIndex);
    }

    prevClue(): void {
        this.letterService.removeClue(this.clueIndex);
        this.clueIndex = this.clueIndex - 1;
        if (this.clueIndex < 0) this.clueIndex = this.letterService.clueWords.length - 1;

        this.letterService.showClueWord(this.clueIndex);
    }

    placeClue(): void {
        this.letterService.submitClue(this.clueIndex);
        this.clueIndex = -1;
    }
}
