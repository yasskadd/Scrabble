import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { GameConfigurationService } from '@app/services/game-configuration.service';
import { TimeService } from '@services/time.service';
import { SNACKBAR_TIMEOUT } from '@common/constants/ui-events';
import { AppRoutes } from '@app/models/app-routes';

@Component({
    selector: 'app-multiplayer-join-page',
    templateUrl: './multiplayer-join-page.component.html',
    styleUrls: ['./multiplayer-join-page.component.scss'],
})
export class MultiplayerJoinPageComponent implements OnInit, OnDestroy {
    playerName: string;
    gameMode: string;

    constructor(
        public timer: TimeService,
        private gameConfiguration: GameConfigurationService,
        private router: Router,
        private snackBar: MatSnackBar,
        private activatedRoute: ActivatedRoute,
    ) {
        this.gameMode = this.activatedRoute.snapshot.params.id;
        this.playerName = '';
    }

    ngOnDestroy() {
        this.gameConfiguration.isRoomJoinable.unsubscribe();
        this.gameConfiguration.errorReason.unsubscribe();
    }

    get availableRooms() {
        return this.gameConfiguration.availableRooms;
    }

    ngOnInit(): void {
        this.listenToServerResponse();
        this.gameConfiguration.resetRoomInformation();
        this.gameConfiguration.joinPage(this.gameMode);
    }

    joinRoom(roomId: string) {
        this.gameConfiguration.joinGame(roomId, this.playerName);
        this.playerName = '';
    }

    joinRandomGame() {
        this.gameConfiguration.joinRandomRoom(this.playerName);
        this.playerName = '';
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
        this.router.navigate([`${AppRoutes.MultiWaitingPage}/${this.gameMode}`]).then();
    }

    openSnackBar(reason: string): void {
        this.snackBar.open(reason, 'fermer', {
            duration: SNACKBAR_TIMEOUT,
            verticalPosition: 'top',
        });
    }
}
