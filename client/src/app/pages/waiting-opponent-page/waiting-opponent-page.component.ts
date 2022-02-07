import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { GameConfigurationService } from '@app/services/game-configuration.service';

@Component({
    selector: 'app-waiting-opponent-page',
    templateUrl: './waiting-opponent-page.component.html',
    styleUrls: ['./waiting-opponent-page.component.scss'],
})
export class WaitingOpponentPageComponent implements OnInit {
    constructor(public gameConfiguration: GameConfigurationService, public router: Router, public snackBar: MatSnackBar) {}

    ngOnInit(): void {
        this.listenToServerResponse();
    }

    listenToServerResponse() {
        this.gameConfiguration.errorReason.subscribe((reason) => {
            if (reason !== '') {
                this.openSnackBar(reason);
                this.exitRoom();
            }
            this.exitRoom();
        });

        this.gameConfiguration.isGameStarted.subscribe((value) => {
            if (value) {
                this.joinGamePage();
            }
        });
    }

    /// soloMode() {} Implementation for sprint 2

    rejectOpponent() {
        this.gameConfiguration.rejectOpponent();
    }

    startGame() {
        this.gameConfiguration.beginScrabbleGame();
    }

    joinGamePage() {
        this.router.navigate(['/game']);
    }
    exitRoom() {
        if (this.gameConfiguration.isCreator) {
            this.router.navigate(['/classique/multijoueur/creer']);
            this.gameConfiguration.removeRoom();
        } else {
            this.router.navigate(['/classique/multijoueur/rejoindre']);
        }
    }

    openSnackBar(reason: string): void {
        this.snackBar.open(reason, 'fermer', {
            verticalPosition: 'top',
        });
    }
}
