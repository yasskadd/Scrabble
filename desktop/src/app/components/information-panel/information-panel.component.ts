import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DialogBoxAbandonGameComponent } from '@app/components/dialog-box-abandon-game/dialog-box-abandon-game.component';
import { DialogGameHelpComponent } from '@app/components/dialog-game-help/dialog-game-help.component';
import { AppRoutes } from '@app/models/app-routes';
import { GameClientService } from '@app/services/game-client.service';
import { LetterPlacementService } from '@services/letter-placement.service';
import { TimeService } from '@services/time.service';

@Component({
    selector: 'app-information-panel',
    templateUrl: './information-panel.component.html',
    styleUrls: ['./information-panel.component.scss'],
})
export class InformationPanelComponent {
    constructor(
        public gameClientService: GameClientService,
        public timer: TimeService,
        protected letterPlacementService: LetterPlacementService,
        private dialog: MatDialog,
        private router: Router,
    ) {}

    abandonGame(): void {
        this.dialog.open(DialogBoxAbandonGameComponent, {
            width: 'auto',
            panelClass: 'abandonDialogComponent',
            disableClose: true,
        });
    }

    leaveGame(): void {
        this.router.navigate([AppRoutes.HomePage]).then();
        this.gameClientService.quitGame();
    }

    openHelpDialog() {
        this.dialog.open(DialogGameHelpComponent, { width: '50%' });
    }

    // filterCompletedObjectives(isFirstPlayer: boolean) {
    // const playerName: string = isFirstPlayer ? this.gameClientService.playerOne.player.user.username : this.gameClientService.secondPlayer.player.user.username;
    // const objectives: Objective[] = isFirstPlayer
    //     ? (this.gameClientService.playerOne.objective as Objective[])
    //     : (this.gameClientService.secondPlayer.objective as Objective[]);
    // return objectives.filter((objective) => objective.complete && objective.user === playerName);
    // }

    // filterNotCompletedObjectives() {
    //     const objectives: Objective[] = this.gameClientService.playerOne.objective as Objective[];
    //     return objectives.filter((objective) => !objective.complete);
    // }
}
