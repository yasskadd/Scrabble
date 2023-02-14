import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { GameConfigurationService } from '@app/services/game-configuration.service';
import { SNACKBAR_TIMEOUT } from '@common/constants/ui-events';

@Component({
    selector: 'app-waiting-opponent-page',
    templateUrl: './waiting-opponent-page.component.html',
    styleUrls: ['./waiting-opponent-page.component.scss'],
})
export class WaitingOpponentPageComponent implements OnInit, OnDestroy {
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

    ngOnDestroy() {
        this.gameConfiguration.errorReason.unsubscribe();
        this.gameConfiguration.isRoomJoinable.unsubscribe();
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

    joinSoloMode() {
        this.gameConfiguration.removeRoom();
        this.router.navigate([`/solo/${this.gameMode}`]).then();
    }

    joinGamePage() {
        this.router.navigate(['/game']).then();
    }

    exitRoom(exitByIsOwn?: boolean) {
        if (this.gameConfiguration.roomInformation.isCreator) {
            this.router.navigate([`/multijoueur/creer/${this.gameMode}`]).then();
            this.gameConfiguration.removeRoom();
        } else {
            this.router.navigate([`/multijoueur/rejoindre/${this.gameMode}`]).then();
            if (!exitByIsOwn) return;
            this.gameConfiguration.exitWaitingRoom();
        }
    }

    openSnackBar(reason: string): void {
        this.snackBar.open(reason, 'fermer', {
            duration: SNACKBAR_TIMEOUT,
            verticalPosition: 'top',
        });
    }
}
