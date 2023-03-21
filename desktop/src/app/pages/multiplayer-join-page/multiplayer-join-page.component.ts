import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppRoutes } from '@app/models/app-routes';
import { GameConfigurationService } from '@app/services/game-configuration.service';
import { UserService } from '@app/services/user.service';
import { SnackBarService } from '@services/snack-bar.service';
import { TimeService } from '@services/time.service';

@Component({
    selector: 'app-multiplayer-join-page',
    templateUrl: './multiplayer-join-page.component.html',
    styleUrls: ['./multiplayer-join-page.component.scss'],
})
export class MultiplayerJoinPageComponent implements OnInit, OnDestroy {
    gameMode: string;

    constructor(
        public timer: TimeService,
        private gameConfiguration: GameConfigurationService,
        private userService: UserService,
        private router: Router,
        private snackBarService: SnackBarService,
        private activatedRoute: ActivatedRoute,
    ) {
        this.gameMode = this.activatedRoute.snapshot.params.id;
    }

    get availableRooms() {
        return this.gameConfiguration.availableRooms;
    }

    ngOnDestroy() {
        this.gameConfiguration.isRoomJoinable.unsubscribe();
        this.gameConfiguration.errorReason.unsubscribe();
    }

    ngOnInit(): void {
        this.listenToServerResponse();
        this.gameConfiguration.resetRoomInformation();
        this.gameConfiguration.joinPage(this.gameMode);
    }

    joinRoom(roomId: string) {
        this.gameConfiguration.joinGame(roomId, this.userService.user.username);
    }

    joinRandomGame() {
        this.gameConfiguration.joinRandomRoom(this.userService.user.username);
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
