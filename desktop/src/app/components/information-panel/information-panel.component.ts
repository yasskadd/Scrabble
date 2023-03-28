import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DialogBoxAbandonGameComponent } from '@app/components/dialog-box-abandon-game/dialog-box-abandon-game.component';
import { DialogGameHelpComponent } from '@app/components/dialog-game-help/dialog-game-help.component';
import { AppRoutes } from '@app/models/app-routes';
import { GameClientService } from '@app/services/game-client.service';
import { TimeService } from '@services/time.service';

@Component({
    selector: 'app-information-panel',
    templateUrl: './information-panel.component.html',
    styleUrls: ['./information-panel.component.scss'],
})
export class InformationPanelComponent {
    constructor(public gameClientService: GameClientService, public timer: TimeService, private dialog: MatDialog, private router: Router) {}

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
}
