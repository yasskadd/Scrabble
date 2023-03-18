import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppRoutes } from '@app/models/app-routes';
import { GameConfigurationService } from '@app/services/game-configuration.service';
import { UserService } from '@app/services/user.service';
import { SnackBarService } from '@services/snack-bar.service';

@Component({
    selector: 'app-waiting-opponent-page',
    templateUrl: './waiting-opponent-page.component.html',
    styleUrls: ['./waiting-opponent-page.component.scss'],
})
export class WaitingOpponentPageComponent implements OnInit, OnDestroy {
    gameMode: string;

    constructor(
        protected gameConfiguration: GameConfigurationService,
        protected userService: UserService,
        private router: Router,
        private snackBarService: SnackBarService,
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
        this.gameConfiguration.errorReason.subscribe((error: string) => {
            if (error !== '') {
                this.snackBarService.openError(error);
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
        this.router.navigate([`${AppRoutes.SoloGameCreationPage}/${this.gameMode}`]).then();
    }

    joinGamePage() {
        this.router.navigate([AppRoutes.GamePage]).then();
    }

    exitRoom(exitByIsOwn?: boolean) {
        if (this.gameConfiguration.roomInformation.isCreator) {
            this.router.navigate([`${AppRoutes.MultiGameCreationPage}/${this.gameMode}`]).then();
            this.gameConfiguration.removeRoom();
        } else {
            this.router.navigate([`${AppRoutes.MultiJoinPage}/${this.gameMode}`]).then();
            if (!exitByIsOwn) return;
            this.gameConfiguration.exitWaitingRoom();
        }
    }
}
