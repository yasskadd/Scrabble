import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppRoutes } from '@app/models/app-routes';
import { GameConfigurationService } from '@app/services/game-configuration.service';
import { UserService } from '@app/services/user.service';
import { GameVisibility } from '@common/models/game-visibility';

@Component({
    selector: 'app-waiting-opponent-page',
    templateUrl: './waiting-opponent-page.component.html',
    styleUrls: ['./waiting-opponent-page.component.scss'],
})
export class WaitingOpponentPageComponent implements OnDestroy {
    protected gameVisibility: typeof GameVisibility = GameVisibility;

    private gameMode: string;

    constructor(
        protected gameConfiguration: GameConfigurationService,
        protected userService: UserService,
        private router: Router,
        private activatedRoute: ActivatedRoute,
    ) {
        this.gameMode = this.activatedRoute.snapshot.params.id;
    }

    ngOnDestroy() {
        this.gameConfiguration.exitWaitingRoom();
        this.gameConfiguration.isRoomJoinable.unsubscribe();
    }

    joinSoloMode() {
        this.router.navigate([`${AppRoutes.SoloGameCreationPage}/${this.gameMode}`]).then();
    }

    exitWaitingRoom(): void {
        if (this.gameConfiguration.isGameCreator()) {
            this.router.navigate([`${AppRoutes.MultiGameCreationPage}/${this.gameMode}`]).then();
        } else {
            this.router.navigate([`${AppRoutes.MultiJoinPage}/${this.gameMode}`]).then();
        }
    }
}
