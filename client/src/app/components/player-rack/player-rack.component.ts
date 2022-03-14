import { Component, ElementRef, HostListener, Input, OnInit, ViewChild } from '@angular/core';
import * as constants from '@app/constants';
import { ChatboxHandlerService } from '@app/services/chatbox-handler.service';
import { GameClientService } from '@app/services/game-client.service';
import { GridService } from '@app/services/grid.service';
import { Letter } from '@common/letter';
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

    width = constants.RACK_WIDTH;
    height = constants.RACK_HEIGHT;
    buttonPressed = '';
    currentSelection = 0;
    previousSelection = constants.INVALID_INDEX;
    previousScrollPosition = 0;
    lettersToExchange: number[] = [];
    lettersToManipulate: number[] = [];

    clicked: number[] = [];

    temp: Letter = { value: 'a', quantity: 2, points: 1, isBlankLetter: false };

    constructor(
        private chatBoxHandler: ChatboxHandlerService,
        public gameClient: GameClientService,
        private tmpService: GridService,
        private eRef: ElementRef,
    ) {}

    @HostListener('mousewheel', ['$event'])
    onScrollEvent(event: WheelEvent) {
        this.cancel();
        this.buttonPressed = event.deltaY < 0 ? 'ArrowLeft' : 'ArrowRight';
        this.repositionRack();
    }

    @HostListener('window: click', ['$event'])
    clickOutside(event: { target: unknown; preventDefault: () => void }) {
        if (!this.eRef.nativeElement.contains(event.target)) {
            this.cancel();
        }
    }

    ngOnInit() {
        this.keyboardParentSubject.subscribe((event) => {
            this.buttonPressed = event.key;
            this.cancel();
            this.selectManipulation(event);
        });
    }

    get letterSize(): number {
        return this.tmpService.letterSize;
    }
    get pointsSize(): number {
        return this.tmpService.letterSize * constants.LETTER_WEIGHT_RATIO;
    }
    get rack(): Letter[] {
        return this.gameClient.playerOne.rack;
    }

    skipTurn() {
        this.chatBoxHandler.submitMessage('!passer');
    }
    selectManipulation(event: KeyboardEvent) {
        const duplicates: number[] = [];

        if (this.buttonPressed === 'ArrowLeft' || this.buttonPressed === 'ArrowRight') {
            this.repositionRack();
            return;
        }

        for (const [i, letter] of this.rack.entries()) {
            if (letter.value === event.key.toLowerCase()) {
                duplicates.push(i);
            }
        }

        if (duplicates.length) {
            this.currentSelection = duplicates[(duplicates.indexOf(this.currentSelection) + 1) % duplicates.length];
            this.previousSelection = this.currentSelection;
            this.lettersToManipulate.push(this.currentSelection);
        } else {
            this.cancel();
        }
    }

    repositionRack() {
        this.previousSelection = constants.INVALID_INDEX;
        if (this.buttonPressed === 'ArrowLeft') {
            this.moveLeft();
        }

        if (this.buttonPressed === 'ArrowRight') {
            this.moveRight();
        }
    }

    onRightClick(event: MouseEvent, letter: number) {
        event.preventDefault();
        this.lettersToManipulate = [];
        const notFound = constants.INVALID_INDEX;
        if (!this.lettersToExchange.includes(letter)) {
            this.lettersToExchange.push(letter);
        } else {
            const index = this.lettersToExchange.indexOf(letter);
            if (index > notFound) {
                this.lettersToExchange.splice(index, 1);
            }
        }
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
            for (const letter of this.rack) {
                if (i === this.rack.indexOf(letter)) {
                    letters += letter.value;
                }
            }
        }
        this.cancel();
        this.chatBoxHandler.submitMessage('!échanger ' + letters);
    }

    cancel() {
        this.lettersToExchange = [];
        this.lettersToManipulate = [];
    }

    moveLeft() {
        const rackIndices = 6;
        if (this.currentSelection === 0) {
            this.temp = this.gameClient.playerOne.rack[0];
            for (let i = 1; i < this.gameClient.playerOne.rack.length; i++) {
                this.gameClient.playerOne.rack[i - 1] = this.gameClient.playerOne.rack[i];
            }
            this.gameClient.playerOne.rack[rackIndices] = this.temp;
            this.currentSelection = rackIndices;
        } else {
            this.temp = this.gameClient.playerOne.rack[this.currentSelection - 1];
            this.gameClient.playerOne.rack[this.currentSelection - 1] = this.gameClient.playerOne.rack[this.currentSelection];
            this.gameClient.playerOne.rack[this.currentSelection] = this.temp;

            this.currentSelection -= 1;
        }

        // this.currentSelection = duplicates[(duplicates.indexOf(this.currentSelection) + 1) % duplicates.length];
        this.lettersToManipulate.push(this.currentSelection);
    }

    moveRight() {
        const rackIndices = 6;
        if (this.currentSelection === rackIndices) {
            this.temp = this.gameClient.playerOne.rack[rackIndices];
            for (let i = this.gameClient.playerOne.rack.length - 1; i > 0; i--) {
                this.gameClient.playerOne.rack[i] = this.gameClient.playerOne.rack[i - 1];
            }
            this.gameClient.playerOne.rack[0] = this.temp;
            this.currentSelection = 0;
        } else {
            this.temp = this.gameClient.playerOne.rack[this.currentSelection + 1];
            this.gameClient.playerOne.rack[this.currentSelection + 1] = this.gameClient.playerOne.rack[this.currentSelection];
            this.gameClient.playerOne.rack[this.currentSelection] = this.temp;
            this.currentSelection += 1;
        }
        this.lettersToManipulate.push(this.currentSelection);
    }
}
