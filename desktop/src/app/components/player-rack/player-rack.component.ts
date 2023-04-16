import { CdkDragDrop, CdkDragMove, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, ElementRef, HostListener, Input } from '@angular/core';
import { ChatboxHandlerService } from '@app/services/chat/chatbox-handler.service';
import { GameClientService } from '@app/services/game-client.service';
import { LetterPlacementService } from '@app/services/letter-placement.service';
import * as board from '@common/constants/board-info';
import { SocketEvents } from '@common/constants/socket-events';
import { Letter } from '@common/interfaces/letter';
import { PlayerInformation } from '@common/interfaces/player-information';
import { PlayerType } from '@common/models/player-type';
import { ClientSocketService } from '@services/communication/client-socket.service';
import { GameConfigurationService } from '@services/game-configuration.service';
import { window as tauriWindow } from '@tauri-apps/api';
import { Subject } from 'rxjs';

// import { Socket } from 'socket.io-client';

@Component({
    selector: 'app-player-rack',
    templateUrl: './player-rack.component.html',
    styleUrls: ['./player-rack.component.scss'],
})
export class PlayerRackComponent {
    @Input()
    keyboardParentSubject: Subject<KeyboardEvent>;

    @Input()
    player: PlayerInformation;

    buttonPressed: string;
    currentSelection: number;
    previousSelection: number;
    lettersToExchange: number[];
    duplicates: number[];

    constructor(
        private chatBoxHandler: ChatboxHandlerService,
        public gameClient: GameClientService,
        private gameConfigurationService: GameConfigurationService,
        public letterPlacementService: LetterPlacementService,
        private clientSocketService: ClientSocketService,
        private eRef: ElementRef,
    ) {
        this.buttonPressed = '';
        this.currentSelection = 0;
        this.previousSelection = board.INVALID_INDEX;
        this.lettersToExchange = [];
        this.duplicates = [];
    }

    @HostListener('window: click', ['$event'])
    clickOutside(event: { target: unknown; preventDefault: () => void }) {
        if (!this.eRef.nativeElement.contains(event.target)) {
            this.lettersToExchange = [];
            this.currentSelection = board.INVALID_INDEX;
            this.previousSelection = board.INVALID_INDEX;
        }
    }

    // ngOnInit() {
    //     this.keyboardParentSubject.subscribe((event) => {
    //         this.buttonPressed = event.key;
    //         this.dispatchAction();
    //     });
    // }

    // dispatchAction() {
    //     if (this.currentSelection !== board.INVALID_INDEX) {
    //         this.cancelSelection();
    //         // this.selectManipulation();
    //     }
    // }

    skipTurn() {
        this.chatBoxHandler.submitMessage('!passer');
    }

    isCurrentPlayerPlaying(): boolean {
        return this.gameClient.getLocalPlayer()?.player.type === PlayerType.User;
    }

    // findDuplicates() {
    //     this.duplicates = [];
    //     for (const [i, letter] of this.gameClient.playerOne.rack.entries()) {
    //         if (letter.value === this.buttonPressed.toLowerCase() && !this.lettersToExchange.includes(i)) {
    //             this.duplicates.push(i);
    //         }
    //     }
    // }

    // selectManipulation() {
    //     this.findDuplicates();
    //     if (!this.duplicates.length) {
    //         this.lettersToExchange = [];
    //         return;
    //     }
    //     this.currentSelection = this.duplicates[(this.duplicates.indexOf(this.currentSelection) + 1) % this.duplicates.length];
    //     this.previousSelection = this.currentSelection;
    // }

    onSelection(event: MouseEvent, letter: number): void {
        event.preventDefault();
        if (!this.lettersToExchange.includes(letter)) {
            this.lettersToExchange.push(letter);
            return;
        }
        this.lettersToExchange.splice(this.lettersToExchange.indexOf(letter), 1);
    }

    exchangeLetters(): void {
        const letters = [];
        for (const i of this.lettersToExchange) {
            letters.push(this.gameClient.getLocalPlayer()?.rack[i].value);
        }
        this.lettersToExchange = [];
        this.clientSocketService.send(SocketEvents.Exchange, letters);
        // this.chatBoxHandler.submitMessage('!échanger ' + letters);
    }

    cancelSelection(): void {
        this.lettersToExchange = [];
    }

    protected drop(event: CdkDragDrop<Letter[]>): void {
        this.lettersToExchange = [];
        if (!this.letterPlacementService.isRemoveValid(event.item.data)) {
            this.letterPlacementService.initSelection();
            return;
        }

        if (event.previousContainer === event.container) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        } else {
            this.letterPlacementService.initLiveTile(event.item.data.coord);
            this.gameClient.getLocalPlayer()?.rack.push(event.item.data.letter);
            this.letterPlacementService.resetSelectionPositions(event.item.data);
        }

        this.clientSocketService.send(SocketEvents.LetterPlaced, {
            roomId: this.gameConfigurationService.localGameRoom.id,
            socketId: this.gameClient.getLocalPlayer()?.player.socketId,
            coord: -event.item.data.coord,
            letter: event.item.data.letter.value.toString(),
        });

        this.letterPlacementService.initSelection();
        this.lettersToExchange = [];
    }

    protected async startedDragging(letter: Letter): Promise<void> {
        this.lettersToExchange = [];
        this.letterPlacementService.currentSelection = letter;

        this.clientSocketService.send(SocketEvents.LetterTaken, {
            roomId: this.gameConfigurationService.localGameRoom.id,
            socketId: this.gameClient.getLocalPlayer()?.player.socketId,
            coord: -1,
            letter: letter.value.toString(),
        });
    }

    protected async dragging(event: CdkDragMove, letter: Letter): Promise<void> {
        if (!this.gameClient.currentlyPlaying()) return;

        const windowSize = await tauriWindow.appWindow.innerSize();
        this.clientSocketService.send(SocketEvents.SendDrag, {
            roomId: this.gameConfigurationService.localGameRoom.id,
            socketId: this.gameClient.getLocalPlayer()?.player.socketId,
            letter: letter.value.toString(),
            coord: [(event.event as MouseEvent).clientX, (event.event as MouseEvent).clientY],
            window: [windowSize.width, windowSize.height],
        });
    }
}
