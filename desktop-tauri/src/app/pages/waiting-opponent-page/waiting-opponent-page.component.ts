import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { GameConfigurationService } from '@app/services/game-configuration.service';

const TIMEOUT = 3000;

@Component({
    selector: 'app-waiting-opponent-page',
    templateUrl: './waiting-opponent-page.component.html',
    styleUrls: ['./waiting-opponent-page.component.scss'],
})
export class WaitingOpponentPageComponent implements OnInit {
    gameMode: string;

    constructor(
        public gameConfiguration: GameConfigurationService,
        private router: Router,
        private snackBar: MatSnackBar,
        private activatedRoute: ActivatedRoute,
    ) {
        this.gameMode = this.activatedRoute.snapshot.params.id;
    }

    ngOnInit(): void {
        this.listenToServerResponse();
    }

    listenToServerResponse() {
        this.gameConfiguration.errorReason.subscribe((reason) => {
            if (reason !== '') {
                this.openSnackBar(reason);
                this.exitRoom();
            }
            this.exitRoom(false);
        });

        this.gameConfiguration.isGameStarted.subscribe((value) => {
            if (value) {
                this.joinGamePage();
            }
        });
    }

    soloMode() {
        this.gameConfiguration.removeRoom();
        this.router.navigate([`/solo/${this.gameMode}`]);
    }

    rejectOpponent() {
        this.gameConfiguration.rejectOpponent();
    }

    startGame() {
        this.gameConfiguration.beginScrabbleGame();
    }

    joinGamePage() {
        this.router.navigate(['/game']);
    }
    exitRoom(exitByIsOwn?: boolean) {
        if (this.gameConfiguration.roomInformation.isCreator) {
            this.router.navigate([`/multijoueur/creer/${this.gameMode}`]);
            this.gameConfiguration.removeRoom();
        } else {
            this.router.navigate([`/multijoueur/rejoindre/${this.gameMode}`]);
            if (!exitByIsOwn) return;
            this.gameConfiguration.exitWaitingRoom();
        }
    }
    openSnackBar(reason: string): void {
        this.snackBar.open(reason, 'fermer', {
            duration: TIMEOUT,
            verticalPosition: 'top',
        });
    }
}
