import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { DialogBoxPasswordComponent } from '@app/components/dialog-box-password/dialog-box-password.component';
import { GameConfigurationService } from '@app/services/game-configuration.service';
import { GameRoom } from '@common/interfaces/game-room';
import { TimeService } from '@services/time.service';
import { RoomPlayer } from '@common/interfaces/room-player';

@Component({
    selector: 'app-multiplayer-join-page',
    templateUrl: './multiplayer-join-page.component.html',
    styleUrls: ['./multiplayer-join-page.component.scss'],
})
export class MultiplayerJoinPageComponent implements OnDestroy, AfterViewInit {
    gameMode: string;
    protected roomIdForm: FormControl;

    constructor(
        protected timer: TimeService,
        protected gameConfiguration: GameConfigurationService,
        private activatedRoute: ActivatedRoute,
        private dialog: MatDialog,
    ) {
        this.gameMode = this.activatedRoute.snapshot.params.id;
        this.roomIdForm = new FormControl('');
    }

    get availableRooms(): GameRoom[] {
        return this.gameConfiguration.availableRooms as GameRoom[];
    }

    ngOnDestroy() {
        this.gameConfiguration.isRoomJoinable.unsubscribe();
    }

    ngAfterViewInit() {
        this.gameConfiguration.resetRoomInformation();
        this.gameConfiguration.joinPage(this.gameMode);
    }

    joinRoom(gameRoom: GameRoom): void {
        if (this.isGameRoomLocked(gameRoom)) {
            this.dialog
                .open(DialogBoxPasswordComponent)
                .afterClosed()
                .subscribe((data: string) => {
                    if (data) {
                        gameRoom.password = data;
                        this.gameConfiguration.joinRoom(gameRoom);
                    }
                });
            return;
        }

        this.gameConfiguration.joinRoom(gameRoom);
    }

    joinSecretRoom(): void {
        this.gameConfiguration.joinSecretRoom(this.roomIdForm.value);
    }

    protected botPresent(room: GameRoom): boolean {
        const present = !!room;

        // TODO : Add verification with right interface
        // room.users.forEach(() => {});

        return present;
    }

    protected observerPresent(room: GameRoom): boolean {
        const present = !!room;

        // TODO : Add verification with right interface
        // room.users.forEach(() => {});

        return present;
    }

    protected isGameRoomLocked(gameRoom: GameRoom) {
        return !gameRoom;
        // return gameRoom.visibility ? gameRoom.visibility === GameVisibility.Locked : true;
    }

    protected getGameCreator(gameRoom: GameRoom): RoomPlayer {
        return gameRoom.players.find((player: RoomPlayer) => player.isCreator);
    }
}
