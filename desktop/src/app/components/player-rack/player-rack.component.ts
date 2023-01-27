import { Component, ElementRef, HostListener, Input, OnInit, ViewChild } from '@angular/core';
import * as constants from '@app/constants/board-view';
import { ChatboxHandlerService } from '@app/services/chatbox-handler.service';
import { GameClientService } from '@app/services/game-client.service';
import { GridService } from '@app/services/grid.service';
import { LetterPlacementService } from '@app/services/letter-placement.service';
import * as board from '@common/constants/board-info';
import { Letter } from '@common/interfaces/letter';
import { Subject } from 'rxjs';

@Component({
    selector: 'app-player-rack',
    templateUrl: './player-rack.component.html',
    styleUrls: ['./player-rack.component.scss'],
})
export class PlayerRackComponent implements OnInit {
    @Input()
    keyboardParentSubject: Subject<KeyboardEvent>;

    @ViewChild('info', { static: false }) info: ElementRef;

    buttonPressed: string;
    currentSelection: number;
    previousSelection: number;
    lettersToExchange: number[];
    lettersToManipulate: number[];
    duplicates: number[];

    constructor(
        private chatBoxHandler: ChatboxHandlerService,
        public gameClient: GameClientService,
        public letterPlacementService: LetterPlacementService,
        private gridService: GridService,
        private eRef: ElementRef,
    ) {
        this.buttonPressed = '';
        this.currentSelection = 0;
        this.previousSelection = board.INVALID_INDEX;
        this.lettersToExchange = [];
        this.lettersToManipulate = [];
        this.duplicates = [];
    }

    @HostListener('mousewheel', ['$event'])
    onScrollEvent(event: WheelEvent) {
        this.buttonPressed = event.deltaY < 0 ? 'ArrowLeft' : 'ArrowRight';
        this.dispatchAction();
    }

    @HostListener('window: click', ['$event'])
    clickOutside(event: { target: unknown; preventDefault: () => void }) {
        if (!this.eRef.nativeElement.contains(event.target)) {
            this.cancel();
            this.currentSelection = board.INVALID_INDEX;
            this.previousSelection = board.INVALID_INDEX;
        }
    }

    ngOnInit() {
        this.keyboardParentSubject.subscribe((event) => {
            this.buttonPressed = event.key;
            this.dispatchAction();
        });
    }

    get letterSize(): number {
        return this.gridService.letterSize;
    }
    get pointsSize(): number {
        return this.gridService.letterSize * constants.LETTER_WEIGHT_RATIO;
    }
    get rack(): Letter[] {
        return this.gameClient.playerOne.rack;
    }

    get rackIndices(): number {
        return this.gameClient.playerOne.rack.length - 1;
    }

    get noPlacedLetters(): boolean {
        return this.letterPlacementService.noLettersPlaced();
    }

    dispatchAction() {
        if (this.currentSelection !== board.INVALID_INDEX) {
            this.cancel();
            this.repositionRack();
            this.selectManipulation();
        }
    }

    skipTurn() {
        this.chatBoxHandler.submitMessage('!passer');
    }

    findDuplicates() {
        this.duplicates = [];
        for (const [i, letter] of this.rack.entries()) {
            if (letter.value === this.buttonPressed.toLowerCase() && !this.lettersToExchange.includes(i)) {
                this.duplicates.push(i);
            }
        }
    }
    selectManipulation() {
        this.findDuplicates();
        if (!this.duplicates.length) {
            this.lettersToExchange = [];
            return;
        }
        this.currentSelection = this.duplicates[(this.duplicates.indexOf(this.currentSelection) + 1) % this.duplicates.length];
        this.previousSelection = this.currentSelection;
        this.lettersToManipulate.push(this.currentSelection);
    }

    repositionRack() {
        if (!this.rack.length) return;
        this.previousSelection = board.INVALID_INDEX;
        if (this.buttonPressed === 'ArrowLeft') {
            this.moveLeft();
        }

        if (this.buttonPressed === 'ArrowRight') {
            this.moveRight();
        }
    }

    playPlacedLetters() {
        this.letterPlacementService.submitPlacement();
    }

    onRightClick(event: MouseEvent, letter: number) {
        event.preventDefault();
        this.lettersToManipulate = [];
        if (!this.lettersToExchange.includes(letter)) {
            this.lettersToExchange.push(letter);
            return;
        }
        this.lettersToExchange.splice(this.lettersToExchange.indexOf(letter), 1);
    }

    onLeftClick(event: MouseEvent, letter: number) {
        event.preventDefault();
        this.cancel();
        this.currentSelection = letter;
        this.lettersToManipulate.push(letter);
    }

    exchange() {
        let letters = '';
        for (const i of this.lettersToExchange) {
            letters += this.rack[i].value;
        }
        this.cancel();
        this.chatBoxHandler.submitMessage('!échanger ' + letters);
    }

    cancel() {
        this.lettersToExchange = [];
        this.lettersToManipulate = [];
    }

    moveLeft() {
        let temp: Letter;
        if (this.currentSelection === 0) {
            temp = this.gameClient.playerOne.rack[0];
            for (let i = 1; i <= this.rackIndices; i++) {
                this.gameClient.playerOne.rack[i - 1] = this.gameClient.playerOne.rack[i];
            }
            this.gameClient.playerOne.rack[this.rackIndices] = temp;
            this.currentSelection = this.rackIndices;
            this.lettersToManipulate.push(this.currentSelection);
            return;
        }
        temp = this.gameClient.playerOne.rack[this.currentSelection - 1];
        this.gameClient.playerOne.rack[this.currentSelection - 1] = this.gameClient.playerOne.rack[this.currentSelection];
        this.gameClient.playerOne.rack[this.currentSelection] = temp;
        this.currentSelection -= 1;
        this.lettersToManipulate.push(this.currentSelection);
    }

    moveRight() {
        let temp;
        if (this.currentSelection === this.rackIndices) {
            temp = this.gameClient.playerOne.rack[this.rackIndices];
            for (let i = this.rackIndices; i > 0; i--) {
                this.gameClient.playerOne.rack[i] = this.gameClient.playerOne.rack[i - 1];
            }
            this.gameClient.playerOne.rack[0] = temp;
            this.currentSelection = 0;
            this.lettersToManipulate.push(this.currentSelection);
            return;
        }
        temp = this.gameClient.playerOne.rack[this.currentSelection + 1];
        this.gameClient.playerOne.rack[this.currentSelection + 1] = this.gameClient.playerOne.rack[this.currentSelection];
        this.gameClient.playerOne.rack[this.currentSelection] = temp;
        this.currentSelection += 1;
        this.lettersToManipulate.push(this.currentSelection);
    }
}
