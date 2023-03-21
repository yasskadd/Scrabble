import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GameConfigurationService } from '@app/services/game-configuration.service';
import { UserService } from '@app/services/user.service';
import { TimeService } from '@services/time.service';
import { GameRoomClient } from '@app/interfaces/game-room-client';

@Component({
    selector: 'app-multiplayer-join-page',
    templateUrl: './multiplayer-join-page.component.html',
    styleUrls: ['./multiplayer-join-page.component.scss'],
})
export class MultiplayerJoinPageComponent implements OnDestroy, AfterViewInit {
    gameMode: string;

    constructor(
        protected timer: TimeService,
        protected gameConfiguration: GameConfigurationService,
        private userService: UserService,
        private activatedRoute: ActivatedRoute,
    ) {
        this.gameMode = this.activatedRoute.snapshot.params.id;
    }

    get availableRooms(): GameRoomClient[] {
        return this.gameConfiguration.availableRooms;
    }

    ngOnDestroy() {
        this.gameConfiguration.isRoomJoinable.unsubscribe();
    }

    ngAfterViewInit() {
        this.gameConfiguration.resetRoomInformation();
        this.gameConfiguration.joinPage(this.gameMode);
    }

    joinRoom(room: GameRoomClient) {
        this.gameConfiguration.joinGame(room, this.userService.user);
    }

    joinRandomGame() {
        this.gameConfiguration.joinRandomRoom();
    }
}
