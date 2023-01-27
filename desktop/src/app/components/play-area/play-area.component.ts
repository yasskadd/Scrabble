import { AfterViewInit, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { MatSliderChange } from '@angular/material/slider';
import * as constants from '@app/constants/board-view';
import { Vec2 } from '@app/interfaces/vec2';
import { GameClientService } from '@app/services/game-client.service';
import { GridService } from '@app/services/grid.service';
import { LetterPlacementService } from '@app/services/letter-placement.service';
import { Subject } from 'rxjs';

export enum MouseButton {
    Left = 0,
    Middle = 1,
    Right = 2,
    Back = 3,
    Forward = 4,
}

@Component({
    selector: 'app-play-area',
    templateUrl: './play-area.component.html',
    styleUrls: ['./play-area.component.scss'],
})
export class PlayAreaComponent implements AfterViewInit {
    @ViewChild('gridCanvas', { static: false }) private gridCanvas!: ElementRef<HTMLCanvasElement>;

    keyboardParentSubject: Subject<KeyboardEvent>;
    mousePosition: Vec2;
    buttonPressed;

    constructor(
        private readonly gridService: GridService,
        private letterService: LetterPlacementService,
        public gameClientService: GameClientService,
    ) {
        this.keyboardParentSubject = new Subject();
        this.mousePosition = { x: 0, y: 0 };
        this.buttonPressed = '';
    }

    @HostListener('keydown', ['$event'])
    buttonDetect(event: KeyboardEvent) {
        this.buttonPressed = event.key;
        switch (this.buttonPressed) {
            case 'Backspace': {
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
                if (this.buttonPressed.length > 1) break;
                this.letterService.handlePlacement(this.buttonPressed);
                break;
            }
        }
        this.keyboardParentSubject.next(event);
    }

    @HostListener('document:click', ['$event'])
    mouseClickOutside(event: MouseEvent) {
        if (!this.gridCanvas.nativeElement.contains(event.target as Node)) this.letterService.undoEverything();
    }

    mouseHitDetect(event: MouseEvent) {
        if (event.button === MouseButton.Left) {
            this.mousePosition = { x: event.offsetX, y: event.offsetY };
            this.letterService.placeLetterStartPosition(this.mousePosition);
        }
    }

    ngAfterViewInit(): void {
        this.gridService.gridContext = this.gridCanvas.nativeElement.getContext('2d') as CanvasRenderingContext2D;
    }

    get width(): number {
        return constants.GRID_CANVAS_WIDTH;
    }

    get height(): number {
        return constants.GRID_CANVAS_HEIGHT;
    }

    updateFontSize(event: MatSliderChange): void {
        this.gridService.letterSize = event.value as number;
        this.gameClientService.updateGameboard();
        this.letterService.resetGameBoardView();
    }
}
