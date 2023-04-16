import { Component, Inject, NgZone } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AppRoutes } from '@app/models/app-routes';
import { GameMode } from '@common/models/game-mode';
import { Router } from '@angular/router';

@Component({
    selector: 'app-dialog-box-game-type',
    templateUrl: './dialog-box-game-type.component.html',
    styleUrls: ['./dialog-box-game-type.component.scss'],
})
export class DialogBoxGameTypeComponent {
    gameMode: string;

    constructor(@Inject(MAT_DIALOG_DATA) protected data: string, private router: Router, private ngZone: NgZone) {}

    navigateMultiCreateGame(): void {
        this.ngZone.run(() => {
            this.router.navigate([`/${AppRoutes.MultiGameCreationPage}/${GameMode.Multi}`]).then();
        });
    }

    navigateSoloCreateGame(): void {
        this.ngZone.run(() => {
            this.router.navigate([`/${AppRoutes.MultiJoinPage}/${this.gameMode}`]).then();
        });
    }

    navigateJoinGame(): void {
        this.ngZone.run(() => {
            this.router.navigate([`/${AppRoutes.SoloGameCreationPage}/${GameMode.Solo}`]).then();
        });
    }
}
