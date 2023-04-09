import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, ElementRef, HostListener, Input } from '@angular/core';
import { ChatboxHandlerService } from '@app/services/chat/chatbox-handler.service';
import { GameClientService } from '@app/services/game-client.service';
import { LetterPlacementService } from '@app/services/letter-placement.service';
import * as board from '@common/constants/board-info';
import { Letter } from '@common/interfaces/letter';
import { Subject } from 'rxjs';
import { RackPosition } from '@app/models/rack-position';
import { PlayerType } from '@common/models/player-type';
import { PlayerInformation } from '@common/interfaces/player-information';

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

    protected rackPosition: typeof RackPosition = RackPosition;

    constructor(
        private chatBoxHandler: ChatboxHandlerService,
        public gameClient: GameClientService,
        public letterPlacementService: LetterPlacementService,
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
            this.cancelSelection();
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
        return this.gameClient.getLocalPlayer().player.type === PlayerType.User && this.player.player.type === PlayerType.User;
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
        let letters = '';
        for (const i of this.lettersToExchange) {
            letters += this.gameClient.getLocalPlayer().rack[i].value;
        }
        this.cancelSelection();
        this.chatBoxHandler.submitMessage('!échanger ' + letters);
    }

    cancelSelection(): void {
        this.lettersToExchange = [];
    }

    protected drop(event: CdkDragDrop<Letter[]>): void {
        if (!this.letterPlacementService.isRemoveValid(event.item.data)) {
            return;
        }

        if (event.previousContainer === event.container) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        } else {
            this.letterPlacementService.resetTile(event.item.data.coord);
            this.gameClient.getLocalPlayer().rack.push(event.item.data.letter);
            this.letterPlacementService.resetSelectionPositions(event.item.data);
        }

        this.letterPlacementService.currentSelection = undefined;
    }
}
