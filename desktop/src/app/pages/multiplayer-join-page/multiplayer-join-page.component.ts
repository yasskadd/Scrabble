import { AfterViewInit, Component, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogBoxPasswordComponent } from '@app/components/dialog-box-password/dialog-box-password.component';
import { GameConfigurationService } from '@app/services/game-configuration.service';
import { SocketEvents } from '@common/constants/socket-events';
import { GameRoom } from '@common/interfaces/game-room';
import { RoomPlayer } from '@common/interfaces/room-player';
import { GameMode } from '@common/models/game-mode';
import { GameRoomState } from '@common/models/game-room-state';
import { GameVisibility } from '@common/models/game-visibility';
import { PlayerType } from '@common/models/player-type';
import { ClientSocketService } from '@services/communication/client-socket.service';
import { TimeService } from '@services/time.service';
import { AppRoutes } from '@app/models/app-routes';
import { MatDrawer } from '@angular/material/sidenav';
import { ChatboxHandlerService } from '@services/chat/chatbox-handler.service';

@Component({
    selector: 'app-multiplayer-join-page',
    templateUrl: './multiplayer-join-page.component.html',
    styleUrls: ['./multiplayer-join-page.component.scss'],
})
export class MultiplayerJoinPageComponent implements OnDestroy, AfterViewInit {
    @ViewChild('drawer') drawer: MatDrawer;
    gameMode: string;
    protected roomIdForm: FormControl;
    protected chatIsOpen: boolean;

    constructor(
        protected timer: TimeService,
        protected gameConfiguration: GameConfigurationService,
        protected chatboxHandler: ChatboxHandlerService,
        private activatedRoute: ActivatedRoute,
        private dialog: MatDialog,
        private clientSocketService: ClientSocketService,
        private router: Router,
        private ngZone: NgZone,
    ) {
        this.chatIsOpen = false;

        this.chatboxHandler.chatWindowOpened.subscribe((value: boolean) => {
            if (value) {
                this.drawer?.close().then();
            } else {
                this.drawer?.open().then();
            }
        });

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

    refresh(): void {
        this.clientSocketService.send(SocketEvents.UpdateGameRooms);
    }

    openChat() {
        this.chatIsOpen = true;
    }

    closeChat() {
        this.chatIsOpen = false;
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

    protected isGameRoomStarted(gameRoom: GameRoom) {
        return gameRoom.state === GameRoomState.Playing;
    }

    protected getGameCreator(gameRoom: GameRoom): RoomPlayer {
        return gameRoom.players.find((player: RoomPlayer) => player.isCreator);
    }

    protected navigateHome() {
        this.ngZone.run(() => {
            this.router.navigate([AppRoutes.HomePage]);
        });
    }
}
