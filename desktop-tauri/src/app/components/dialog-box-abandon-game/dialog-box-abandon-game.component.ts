import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { GameClientService } from '@app/services/game-client.service';

const TIMEOUT = 3000;

@Component({
    selector: 'app-dialog-box-abandon-game',
    templateUrl: './dialog-box-abandon-game.component.html',
    styleUrls: ['./dialog-box-abandon-game.component.scss'],
})
export class DialogBoxAbandonGameComponent {
    constructor(private gameclient: GameClientService, private router: Router, private snackBar: MatSnackBar) {}

    abandonGame() {
        this.gameclient.abandonGame();
        this.router.navigate(['/home']);
        this.openSnackBar();
    }

    openSnackBar(): void {
        this.snackBar.open('Vous avez abandonné la partie', 'fermer', {
            duration: TIMEOUT,
            verticalPosition: 'top',
        });
    }
}
