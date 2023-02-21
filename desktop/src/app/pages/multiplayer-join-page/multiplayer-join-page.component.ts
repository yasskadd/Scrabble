import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GameConfigurationService } from '@app/services/game-configuration.service';
import { TimeService } from '@services/time.service';
import { AppRoutes } from '@app/models/app-routes';
import { FormControl, Validators } from '@angular/forms';
import { SnackBarService } from '@services/snack-bar.service';

@Component({
    selector: 'app-multiplayer-join-page',
    templateUrl: './multiplayer-join-page.component.html',
    styleUrls: ['./multiplayer-join-page.component.scss'],
})
export class MultiplayerJoinPageComponent implements OnInit, OnDestroy {
    playerNameForm: FormControl;
    gameMode: string;

    constructor(
        public timer: TimeService,
        private gameConfiguration: GameConfigurationService,
        private router: Router,
        private snackBarService: SnackBarService,
        private activatedRoute: ActivatedRoute,
    ) {
        this.gameMode = this.activatedRoute.snapshot.params.id;
        this.playerNameForm = new FormControl('', Validators.required);
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
        this.gameConfiguration.joinGame(roomId, this.playerNameForm.value);
        this.playerNameForm.setValue('');
    }

    joinRandomGame() {
        this.gameConfiguration.joinRandomRoom(this.playerNameForm.value);
        this.playerNameForm.setValue('');
    }

    listenToServerResponse() {
        this.gameConfiguration.isRoomJoinable.subscribe((value) => {
            if (value) this.navigatePage();
        });
        this.gameConfiguration.errorReason.subscribe((error) => {
            if (error) {
                this.snackBarService.openError(error);
            }
        });
    }

    navigatePage() {
        this.router.navigate([`${AppRoutes.MultiWaitingPage}/${this.gameMode}`]).then();
    }
}
