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
import { PlayerType } from '@common/models/player-type';
import { UserService } from '@services/user.service';
import { RoomPlayer } from '@common/interfaces/room-player';
import { INVALID_INDEX } from '@common/constants/board-info';

@Component({
    selector: 'app-information-panel',
    templateUrl: './information-panel.component.html',
    styleUrls: ['./information-panel.component.scss'],
})
export class InformationPanelComponent {
    protected selectedPlayer: PlayerInformation;
    private clueIndex: number;

    constructor(
        public gameClientService: GameClientService,
        protected letterService: LetterPlacementService,
        protected userService: UserService,
        private clientSocketService: ClientSocketService,
        public timer: TimeService,
        private dialog: MatDialog,
        private router: Router,
    ) {
        this.clueIndex = -1;
    }

    get players(): PlayerInformation[] {
        return this.gameClientService.players.filter((p: PlayerInformation) => {
            return p.player.type !== PlayerType.Observer;
        });
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
            if (this.clueIndex === INVALID_INDEX) {
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

    selectPlayer(player: RoomPlayer): void {
        this.gameClientService.selectedPlayer = this.gameClientService.players.find((p: PlayerInformation) => p.player.user._id === player.user._id);
    }

    replaceBot(player: PlayerInformation) {
        this.clientSocketService.send(SocketEvents.JoinAsObserver, player.player.user._id);
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/member-ordering
    protected readonly PlayerType = PlayerType;
}
