import { AfterContentChecked, Component, HostListener, OnDestroy } from '@angular/core';
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
export class WaitingOpponentPageComponent implements OnDestroy, AfterContentChecked {
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

    // TODO : Check for page refresh also
    @HostListener('window:popstate', ['$event'])
    onPopState() {
        // this.gameConfiguration.exitWaitingRoom();
    }

    ngAfterContentChecked(): void {
        this.listenToServerResponse();
    }

    ngOnDestroy() {
        this.gameConfiguration.exitWaitingRoom();
        this.gameConfiguration.isRoomJoinable.unsubscribe();
    }

    listenToServerResponse() {
        this.gameConfiguration.isGameStarted.subscribe((value) => {
            if (value) {
                this.joinGamePage();
            }
        });
    }

    joinSoloMode() {
        // this.gameConfiguration.exitWaitingRoom();
        this.router.navigate([`${AppRoutes.SoloGameCreationPage}/${this.gameMode}`]).then();
    }

    joinGamePage() {
        this.router.navigate([AppRoutes.GamePage]).then();
    }

    exitWaitingRoom(): void {
        if (this.gameConfiguration.isGameCreator()) {
            this.router.navigate([`${AppRoutes.MultiGameCreationPage}/${this.gameMode}`]).then();
        } else {
            this.router.navigate([`${AppRoutes.MultiJoinPage}/${this.gameMode}`]).then();
        }
    }
}
