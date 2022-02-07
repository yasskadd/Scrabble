import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { GameConfigurationService } from '@app/services/game-configuration.service';

@Component({
    selector: 'app-multiplayer-join-page',
    templateUrl: './multiplayer-join-page.component.html',
    styleUrls: ['./multiplayer-join-page.component.scss'],
})
export class MultiplayerJoinPageComponent implements OnInit {
    playerName: string;
    constructor(public gameConfiguration: GameConfigurationService, public router: Router, public snackBar: MatSnackBar) {}

    ngOnInit(): void {
        this.listenToServerResponse();
        this.gameConfiguration.joinPage();
    }

    joinRoom(roomId: string) {
        this.gameConfiguration.joinGame(roomId, this.playerName);
        this.playerName = '';
    }
    joinRandomGame() {
        // For Sprint 2
        // this.gameConfiguration.joinRandomRoom(this.playerName);
        // this.playerName = '';
    }

    listenToServerResponse() {
        this.gameConfiguration.isRoomJoinable.subscribe((value) => {
            if (value) this.navigatePage();
        });
        this.gameConfiguration.errorReason.subscribe((reason) => {
            if (reason !== '') {
                this.openSnackBar(reason);
            }
        });
    }

    navigatePage() {
        this.router.navigate(['/classique/multijoueur/salleAttente']);
    }
    openSnackBar(reason: string): void {
        this.snackBar.open(reason, 'fermer', {
            verticalPosition: 'top',
        });
    }
}
