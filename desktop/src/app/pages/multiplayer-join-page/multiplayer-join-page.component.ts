import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { DialogBoxPasswordComponent } from '@app/components/dialog-box-password/dialog-box-password.component';
import { GameConfigurationService } from '@app/services/game-configuration.service';
import { GameRoom } from '@common/interfaces/game-room';
import { TimeService } from '@services/time.service';
import { RoomPlayer } from '@common/interfaces/room-player';
import { PlayerType } from '@common/models/player-type';
import { GameVisibility } from '@common/models/game-visibility';
import { GameMode } from '@common/models/game-mode';

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
        return this.gameConfiguration.availableRooms;
    }

    ngOnDestroy() {
        this.gameConfiguration.isRoomJoinable.unsubscribe();
    }

    ngAfterViewInit() {
        this.gameConfiguration.resetRoomInformations();
        this.gameConfiguration.navigateJoinPage(
            this.gameMode === 'solo' ? GameMode.Solo : this.gameMode === 'multi' ? GameMode.Multi : GameMode.Null,
        );
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

    joinRandomRoom(): void {
        this.joinRoom(this.availableRooms[Math.floor(Math.random() * this.availableRooms.length)]);
    }

    protected getPlayers(room: GameRoom) {
        return room.players.filter((player: RoomPlayer) => player.type === PlayerType.User);
    }

    protected getBots(room: GameRoom): RoomPlayer[] | undefined {
        return room.players.filter((player: RoomPlayer) => player.type === PlayerType.Bot);
    }

    protected getObservers(room: GameRoom): RoomPlayer[] {
        return room.players.filter((player: RoomPlayer) => player.type === PlayerType.Observer);
    }

    protected isGameRoomLocked(gameRoom: GameRoom) {
        return gameRoom.visibility === GameVisibility.Locked;
    }

    protected getGameCreator(gameRoom: GameRoom): RoomPlayer {
        return gameRoom.players.find((player: RoomPlayer) => player.isCreator);
    }
}
