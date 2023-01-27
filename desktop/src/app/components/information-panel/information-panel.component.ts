import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DialogBoxAbandonGameComponent } from '@app/components/dialog-box-abandon-game/dialog-box-abandon-game.component';
import { DialogGameHelpComponent } from '@app/components/dialog-game-help/dialog-game-help.component';
import { GameClientService } from '@app/services/game-client.service';
import { TimerService } from '@app/services/timer.service';
import { Objective } from '@common/interfaces/objective';

@Component({
    selector: 'app-information-panel',
    templateUrl: './information-panel.component.html',
    styleUrls: ['./information-panel.component.scss'],
})
export class InformationPanelComponent {
    constructor(public gameClientService: GameClientService, public timer: TimerService, private dialog: MatDialog, private router: Router) {}

    abandonGame(): void {
        this.dialog.open(DialogBoxAbandonGameComponent, {
            width: 'auto',
            panelClass: 'abandonDialogComponent',
            disableClose: true,
        });
    }

    leaveGame(): void {
        this.router.navigate(['/home']);
        this.gameClientService.quitGame();
    }

    openHelpDialog() {
        this.dialog.open(DialogGameHelpComponent, { width: '50%' });
    }

    filterCompletedObjectives(isFirstPlayer: boolean) {
        const playerName: string = isFirstPlayer ? this.gameClientService.playerOne.name : this.gameClientService.secondPlayer.name;
        const objectives: Objective[] = isFirstPlayer
            ? (this.gameClientService.playerOne.objective as Objective[])
            : (this.gameClientService.secondPlayer.objective as Objective[]);
        return objectives.filter((objective) => objective.complete && objective.user === playerName);
    }

    filterNotCompletedObjectives() {
        const objectives: Objective[] = this.gameClientService.playerOne.objective as Objective[];
        return objectives.filter((objective) => !objective.complete);
    }
}
