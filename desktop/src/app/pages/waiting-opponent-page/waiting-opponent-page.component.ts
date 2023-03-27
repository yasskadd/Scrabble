import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppRoutes } from '@app/models/app-routes';
import { GameConfigurationService } from '@app/services/game-configuration.service';
import { UserService } from '@app/services/user.service';
import { GameVisibility } from '@common/models/game-visibility';
import { RoomPlayer } from '@common/interfaces/room-player';
import { PlayerType } from '@common/models/player-type';

@Component({
    selector: 'app-waiting-opponent-page',
    templateUrl: './waiting-opponent-page.component.html',
    styleUrls: ['./waiting-opponent-page.component.scss'],
})
export class WaitingOpponentPageComponent implements OnDestroy {
    protected gameVisibility: typeof GameVisibility = GameVisibility;
    protected playerType: typeof PlayerType = PlayerType;

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
        // this.gameConfiguration.exitWaitingRoom();
        this.gameConfiguration.isRoomJoinable.unsubscribe();
    }

    protected joinSoloMode(): void {
        this.router.navigate([`${AppRoutes.SoloGameCreationPage}/${this.gameMode}`]).then();
    }

    protected exitWaitingRoom(): void {
        if (this.gameConfiguration.isGameCreator()) {
            this.router.navigate([`${AppRoutes.MultiGameCreationPage}/${this.gameMode}`]).then();
        } else {
            this.router.navigate([`${AppRoutes.MultiJoinPage}/${this.gameMode}`]).then();
        }
    }

    protected isValidGame(): boolean {
        console.log(this.gameConfiguration.localGameRoom.players.filter((player: RoomPlayer) => player.type === PlayerType.User).length);
        console.log(this.gameConfiguration.localGameRoom.players.filter((player: RoomPlayer) => player.type === PlayerType.User).length > 1);
        return this.gameConfiguration.localGameRoom.players.filter((player: RoomPlayer) => player.type === PlayerType.User).length > 1;
    }
}
