import { Injectable } from '@angular/core';
const RACK_LETTERS = 7;
const TILE_SIZE = 35;
export const DEFAULT_WIDTH = 500;
export const DEFAULT_HEIGHT = 75;

@Injectable({
    providedIn: 'root',
})
export class LetterTilesService {
    minimumSize: number;
    maxSize: number;
    gridContext: CanvasRenderingContext2D;

    constructor() {
        this.minimumSize = 15;
        this.maxSize = 20;
    }

    drawRack() {
        for (let i = 0; i < RACK_LETTERS; i++) {
            this.drawLetterTile(DEFAULT_WIDTH * 0.25 + TILE_SIZE * i, 1, 'A');
            this.drawLetterWeight(TILE_SIZE * i + DEFAULT_WIDTH * 0.25, 0, '1');
        }
    }

    // this function would be similar to drawBasicTile from GridService.
    drawLetterTile(x: number, y: number, letter: string) {
        // this.gridContext.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        this.gridContext.strokeStyle = '#C7A121';
        this.gridContext.lineWidth = 1;
        this.gridContext.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
        this.gridContext.font = 20 + 'px system-ui';
        this.gridContext.textBaseline = 'middle';
        this.gridContext.textAlign = 'center';
        this.gridContext.fillText(letter, x + TILE_SIZE / 2, TILE_SIZE / 2);
    }

    drawLetterWeight(x: number, y: number, string: string) {
        this.gridContext.textBaseline = 'middle';
        this.gridContext.textAlign = 'center';
        const width = this.gridContext.measureText(string).width;
        const plusX = width * 0.9;
        const halfSize = 20 / 2;
        this.gridContext.font = 20 * 0.45 + 'px system-ui';
        this.gridContext.fillText(string, x + TILE_SIZE / 2 + plusX, y + halfSize + TILE_SIZE / 2, 20);
    }

    // drawLetterWeight(letter: Letter) {
    //   this.gridContext.
    // }
}
