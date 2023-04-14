import { Component, HostListener } from '@angular/core';
import { FormControl } from '@angular/forms';
import * as constants from '@app/constants/board-view';
import { Vec2 } from '@app/interfaces/vec2';
import { RackPosition } from '@app/models/rack-position';
import { GameClientService } from '@app/services/game-client.service';
import { GridService } from '@app/services/grid.service';
import { LetterPlacementService } from '@app/services/letter-placement.service';
import { PlayerInformation } from '@common/interfaces/player-information';
import { Subject } from 'rxjs';
import { PlayerType } from '@common/models/player-type';
import { ClientSocketService } from '@app/services/communication/client-socket.service';
import { SocketEvents } from '@common/constants/socket-events';

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
    protected selectedPlayer: PlayerInformation;

    protected playerType: typeof PlayerType = PlayerType;

    private clueIndex: number;

    constructor(
        private readonly gridService: GridService,
        protected letterService: LetterPlacementService,
        private clientSocketService: ClientSocketService,
        public gameClientService: GameClientService,
    ) {
        this.sliderForm = new FormControl(this.gridService.letterSize);
        this.keyboardParentSubject = new Subject();
        this.mousePosition = { x: 0, y: 0 };
        this.chatIsOpen = false;
        this.clueIndex = 1;

        // this.sliderForm.valueChanges.subscribe(() => {
        //     this.updateFontSize();
        // });
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
                this.letterService.undoPlacement();
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
                this.letterService.handleKeyPlacement(event.key);
                break;
            }
        }
        this.keyboardParentSubject.next(event);
    }

    openChat() {
        this.chatIsOpen = true;
    }

    closeChat() {
        this.chatIsOpen = false;
    }

    updateFontSize(): void {
        this.gridService.letterSize = this.sliderForm.value;
    }

    selectPlayer(index: number): void {
        this.selectedPlayer = this.gameClientService.players[index];
    }

    getPosition(index: number): RackPosition {
        return Object.values(RackPosition)[index];
    }

    replaceBot(player: PlayerInformation) {
        this.clientSocketService.send(SocketEvents.JoinAsObserver, player.player.user._id);
    }

    nextClue(): void {
        this.letterService.removeClue(this.clueIndex);
        this.clueIndex = (this.clueIndex + 1) % this.letterService.clueWords.length;
        this.letterService.showClueWord(this.clueIndex);
    }

    prevClue(): void {
        this.letterService.removeClue(this.clueIndex);
        this.clueIndex = this.clueIndex - 1;
        if (this.clueIndex < 0) this.clueIndex = this.letterService.clueWords.length - 1;

        this.letterService.showClueWord(this.clueIndex);
    }

    placeClue(): void {
        this.letterService.submitClue(this.clueIndex);
    }
}
