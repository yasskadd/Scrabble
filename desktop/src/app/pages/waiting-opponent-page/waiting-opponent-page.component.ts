import { Component, NgZone, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppRoutes } from '@app/models/app-routes';
import { GameConfigurationService } from '@app/services/game-configuration.service';
import { UserService } from '@app/services/user.service';
import { RoomPlayer } from '@common/interfaces/room-player';
import { GameVisibility } from '@common/models/game-visibility';
import { PlayerType } from '@common/models/player-type';
import { ChatboxHandlerService } from '@services/chat/chatbox-handler.service';

@Component({
    selector: 'app-waiting-opponent-page',
    templateUrl: './waiting-opponent-page.component.html',
    styleUrls: ['./waiting-opponent-page.component.scss'],
})
export class WaitingOpponentPageComponent implements OnDestroy {
    protected gameVisibility: typeof GameVisibility = GameVisibility;
    protected playerType: typeof PlayerType = PlayerType;

    private gameMode: string;
    protected chatIsOpen: boolean;

    constructor(
        protected gameConfiguration: GameConfigurationService,
        protected chatboxHandler: ChatboxHandlerService,
        protected userService: UserService,
        private router: Router,
        private ngZone: NgZone,
        private activatedRoute: ActivatedRoute,
    ) {
        this.chatIsOpen = false;
        this.gameMode = this.activatedRoute.snapshot.params.id;
    }

    getRoomPlayers(): RoomPlayer[] {
        return this.gameConfiguration.localGameRoom.players;
    }

    ngOnDestroy() {
        this.gameConfiguration.isRoomJoinable.unsubscribe();
    }

    protected joinSoloMode(): void {
        this.ngZone.run(() => {
            this.router.navigate([`${AppRoutes.SoloGameCreationPage}/${this.gameMode}`]).then();
        });
    }

    protected exitWaitingRoom(): void {
        if (this.gameConfiguration.isGameCreator()) {
            this.ngZone.run(() => {
                this.router.navigate([`${AppRoutes.MultiGameCreationPage}/${this.gameMode}`]).then();
            });
        } else {
            this.ngZone.run(() => {
                this.router.navigate([`${AppRoutes.MultiJoinPage}/${this.gameMode}`]).then();
            });
        }
        this.gameConfiguration.exitWaitingRoom();
    }

    protected isValidGame(): boolean {
        return this.gameConfiguration.localGameRoom.players.filter((player: RoomPlayer) => player.type === PlayerType.User).length > 1;
    }
}
