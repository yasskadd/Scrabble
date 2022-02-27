import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AbandonGameDialogBoxComponent } from '@app/components/abandon-game-dialog-box/abandon-game-dialog-box.component';
import { GameClientService } from '@app/services/game-client.service';
import { GridService } from '@app/services/grid.service';

@Component({
    selector: 'app-information-panel',
    templateUrl: './information-panel.component.html',
    styleUrls: ['./information-panel.component.scss'],
})
export class InformationPanelComponent {
    value: number;
    private readonly dialogWidth: string = '40%';

    constructor(public gridService: GridService, public gameClientService: GameClientService, public dialog: MatDialog, public router: Router) {}

    formatLabel(value: number): string {
        return value + 'px';
    }

    updateFontSize(): void {
        this.gridService.letterSize = this.value;
        this.gameClientService.updateGameboard();
    }

    abandonGame(): void {
        this.dialog.open(AbandonGameDialogBoxComponent, {
            width: this.dialogWidth,
            backdropClass: 'abandonDialogComponent',
            panelClass: 'abandonDialogComponent',
            disableClose: true,
        });
    }
    leaveGame(): void {
        this.router.navigate(['/home']);
        this.gameClientService.quitGame();
    }
}
