import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { GameRoomClient } from '@app/interfaces/game-room-client';
import { GameConfigurationService } from '@app/services/game-configuration.service';
import { TimeService } from '@services/time.service';

@Component({
    selector: 'app-multiplayer-join-page',
    templateUrl: './multiplayer-join-page.component.html',
    styleUrls: ['./multiplayer-join-page.component.scss'],
})
export class MultiplayerJoinPageComponent implements OnDestroy, AfterViewInit {
    gameMode: string;
    protected roomIdForm: FormControl;

    constructor(protected timer: TimeService, protected gameConfiguration: GameConfigurationService, private activatedRoute: ActivatedRoute) {
        this.gameMode = this.activatedRoute.snapshot.params.id;
        this.roomIdForm = new FormControl('');
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

    joinSecretRoom(): void {
        this.gameConfiguration.joinSecretRoom(this.roomIdForm.value);
    }

    protected botPresent(room: GameRoomClient): boolean {
        let present: boolean = false;

        // TODO : Add verification with right interface
        room.users.forEach(() => {});

        return present;
    }

    protected observerPresent(room: GameRoomClient): boolean {
        let present: boolean = false;

        // TODO : Add verification with right interface
        room.users.forEach(() => {});

        return present;
    }
}
