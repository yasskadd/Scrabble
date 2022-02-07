import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { LetterTilesService } from '@app/services/letter-tiles.service';

export const DEFAULT_WIDTH = 500;
export const DEFAULT_HEIGHT = 45;

@Component({
    selector: 'app-player-rack',
    templateUrl: './player-rack.component.html',
    styleUrls: ['./player-rack.component.scss'],
})
export class PlayerRackComponent implements AfterViewInit {
    @ViewChild('rackCanvas', { static: false }) private rackCanvas!: ElementRef<HTMLCanvasElement>;

    private canvasSize = { x: DEFAULT_WIDTH, y: DEFAULT_HEIGHT };

    constructor(private readonly letterTilesService: LetterTilesService) {}

    ngAfterViewInit(): void {
        this.letterTilesService.gridContext = this.rackCanvas.nativeElement.getContext('2d') as CanvasRenderingContext2D;
        this.letterTilesService.drawRack();
        // this.letterTilesService.drawLetterTile(12, 5, 'A');
        // this.letterTilesService.gridContext.fillStyle = '#FA5F55';
        // this.letterTilesService.gridContext.fillRect(10, 10, 350, 75);
        // this.letterTilesService.gridContext.strokeStyle = '#80461B';
        // this.letterTilesService.gridContext.lineWidth = 1;
        // this.letterTilesService.gridContext.strokeRect(10, 10, this.letterTilesService.minimumSize, this.letterTilesService.minimumSize);
        // this.gridService.drawWord('Scrabble');
        this.rackCanvas.nativeElement.focus();
    }

    get width(): number {
        return this.canvasSize.x;
    }

    get height(): number {
        return this.canvasSize.y;
    }

    // addLetterToRack() {}
}
