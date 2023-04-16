import { Component, HostListener } from '@angular/core';
import { FormControl } from '@angular/forms';
import * as constants from '@app/constants/board-view';
import { Vec2 } from '@app/interfaces/vec2';
import { RackPosition } from '@app/models/rack-position';
import { GameClientService } from '@app/services/game-client.service';
import { GridService } from '@app/services/grid.service';
import { LetterPlacementService } from '@app/services/letter-placement.service';
import { PlayerInformation } from '@common/interfaces/player-information';
import { PlayerType } from '@common/models/player-type';
import { Subject } from 'rxjs';

// export enum MouseButton {
//     Left = 0,
//     Right = 2,
//     Back = 3,
// }

@Component({
    selector: 'app-play-area',
    templateUrl: './play-area.component.html',
    styleUrls: ['./play-area.component.scss'],
})
export class PlayAreaComponent {
    keyboardParentSubject: Subject<KeyboardEvent>;
    mousePosition: Vec2;
    protected sliderForm: FormControl;
    protected chatIsOpen: boolean;

    protected playerType: typeof PlayerType = PlayerType;
    private focus: boolean;

    constructor(
        private readonly gridService: GridService,
        protected letterService: LetterPlacementService,
        public gameClientService: GameClientService,
    ) {
        this.sliderForm = new FormControl(this.gridService.letterSize);
        this.keyboardParentSubject = new Subject();
        this.mousePosition = { x: 0, y: 0 };
        this.chatIsOpen = false;

        // this.sliderForm.valueChanges.subscribe(() => {
        //     this.updateFontSize();
        // });
    }

    get selectedPlayer(): PlayerInformation {
        return this.gameClientService.selectedPlayer;
    }

    get width(): number {
        return constants.GRID_CANVAS_WIDTH;
    }

    get height(): number {
        return constants.GRID_CANVAS_HEIGHT;
    }

    @HostListener('keydown', ['$event'])
    buttonDetect(event: KeyboardEvent) {
        switch (event.key) {
            case 'Backspace': {
                event.preventDefault();
                if (this.letterService.placedLetters.length !== 0 && this.focus) {
                    this.letterService.undoPlacement();
                }
                break;
            }
            case 'Enter': {
                this.letterService.submitPlacement();
                break;
            }
            case 'Escape': {
                this.letterService.undoEverything();
                break;
            }
            default: {
                if (event.key.length > 1) break;
                if (this.focus) {
                    this.letterService.handleKeyPlacement(event.key);
                }
                break;
            }
        }
        this.keyboardParentSubject.next(event);
    }

    setFocus(value: boolean): void {
        this.focus = value;
    }

    openChat() {
        this.chatIsOpen = true;
    }

    closeChat() {
        this.chatIsOpen = false;
    }

    getPosition(index: number): RackPosition {
        return Object.values(RackPosition)[index];
    }
}
