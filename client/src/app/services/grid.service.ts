import { Injectable } from '@angular/core';

// TODO : Avoir un fichier séparé pour les constantes et ne pas les répéter!
export const DEFAULT_WIDTH = 500;
export const DEFAULT_HEIGHT = 500;
// Better organize later
const SQUARES_NUMBER = 16;
const LETTER_TILE_RATIO = 0.8;

type Coord = { x: number; y: number };
@Injectable({
    providedIn: 'root',
})
export class GridService {
    private static squareWidth = DEFAULT_WIDTH / SQUARES_NUMBER;
    private static squareHeight = DEFAULT_HEIGHT / SQUARES_NUMBER;
    private static letterTileWidth = GridService.squareWidth * LETTER_TILE_RATIO;
    private static letterTileHeight = GridService.squareHeight * LETTER_TILE_RATIO;
    private static halfSquareWidth = GridService.squareWidth / 2;
    private static halfSquareHeight = GridService.squareHeight / 2;

    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    // private static wordMultiplyThree = [1, 8, 15];

    size: number;
    weightSize: number;
    gridContext: CanvasRenderingContext2D;
    constructor() {
        this.size = 15;
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        this.weightSize = this.size * 0.45;
    }

    // TODO : pas de valeurs magiques!! Faudrait avoir une meilleure manière de le faire
    /* eslint-disable @typescript-eslint/no-magic-numbers */
    drawGrid() {
        for (let i = 1; i <= SQUARES_NUMBER; i++) {
            for (let j = 1; j <= SQUARES_NUMBER; j++) {
                this.drawBasicTile(GridService.squareWidth * i, GridService.squareHeight * j);
            }
        }
        this.drawRowNumbers();
        this.drawColumnAlphabet();
        this.drawMultipliers();
        const middlePos = this.positionXYPixel(8, 8);
        this.drawWordMultiplierByTwoTile(middlePos.x, middlePos.y);
        this.gridContext.fillStyle = 'black';
        this.drawStar(middlePos.x + GridService.halfSquareWidth, middlePos.y + GridService.halfSquareHeight, 5, 10, 5);
    }

    drawRowNumbers() {
        this.gridContext.font = this.size + 'px system-ui';
        for (let i = 1; i <= 15; i++) {
            this.gridContext.fillStyle = 'black';
            const positions = this.positionXYPixel(i, 0);
            this.drawNumber(positions.x, positions.y, String(i));
        }
    }

    drawColumnAlphabet() {
        const chatCode = 64;
        for (let i = 1; i <= 15; i++) {
            const char = String.fromCharCode(chatCode + i);
            this.gridContext.fillStyle = 'black';
            const positions = this.positionXYPixel(0, i);
            this.drawLetter(positions.x, positions.y, char);
        }
    }

    drawMultipliers() {
        const letterMultipliersByTwo: number[][] = [
            [3, 0],
            [11, 0],
            [6, 2],
            [8, 2],
            [0, 3],
            [7, 3],
            [14, 3],
            [2, 6],
            [6, 6],
            [8, 6],
            [12, 6],
            [3, 7],
            [11, 7],
            [2, 8],
            [6, 8],
            [8, 8],
            [12, 8],
            [0, 11],
            [7, 11],
            [14, 11],
            [6, 12],
            [8, 12],
            [3, 14],
            [11, 14],
        ];

        const letterMultipliersByThree: number[][] = [
            [5, 1],
            [9, 1],
            [1, 5],
            [5, 5],
            [9, 5],
            [13, 5],
            [1, 9],
            [5, 9],
            [9, 9],
            [13, 9],
            [5, 13],
            [9, 13],
        ];

        const wordMultipliersByTwo: number[][] = [
            [1, 1],
            [2, 2],
            [3, 3],
            [4, 4],
            [10, 4],
            [11, 3],
            [12, 2],
            [13, 1],
            [1, 13],
            [2, 12],
            [3, 11],
            [4, 10],
            [10, 10],
            [11, 11],
            [12, 12],
            [13, 13],
        ];

        const wordMultipliersByThree: number[][] = [
            [0, 0],
            [7, 0],
            [14, 0],
            [0, 7],
            [14, 7],
            [0, 14],
            [7, 14],
            [14, 14],
        ];

        letterMultipliersByTwo.forEach((multiplyLetterByTwoPosition) => {
            const x = multiplyLetterByTwoPosition[0] + 1;
            const y = multiplyLetterByTwoPosition[1] + 1;
            const letterPos = this.positionXYPixel(x, y);
            this.drawLetterMultiplierByTwoTile(letterPos.x, letterPos.y);
            this.drawMultiplierIcon(GridService.squareWidth * x, GridService.squareHeight * y, 2);
            this.drawMultiplierType(GridService.squareWidth * x, GridService.squareHeight * y, 'LETTRE');
        });

        letterMultipliersByThree.forEach((multiplyLetterByThreePosition) => {
            const x = multiplyLetterByThreePosition[0] + 1;
            const y = multiplyLetterByThreePosition[1] + 1;
            const letterPos = this.positionXYPixel(x, y);
            this.drawLetterMultiplierByThreeTile(letterPos.x, letterPos.y);
            this.drawMultiplierIcon(GridService.squareWidth * x, GridService.squareHeight * y, 3);
            this.drawMultiplierType(GridService.squareWidth * x, GridService.squareHeight * y, 'LETTRE');
        });

        wordMultipliersByTwo.forEach((multiplyWordByTwoPosition) => {
            const x = multiplyWordByTwoPosition[0] + 1;
            const y = multiplyWordByTwoPosition[1] + 1;
            const letterPos = this.positionXYPixel(x, y);
            this.drawWordMultiplierByTwoTile(letterPos.x, letterPos.y);
            this.drawMultiplierIcon(GridService.squareWidth * x, GridService.squareHeight * y, 2);
            this.drawMultiplierType(GridService.squareWidth * x, GridService.squareHeight * y, 'MOT');
        });

        wordMultipliersByThree.forEach((multiplyWordByThreePosition) => {
            const x = multiplyWordByThreePosition[0] + 1;
            const y = multiplyWordByThreePosition[1] + 1;
            const letterPos = this.positionXYPixel(x, y);
            this.drawWordMultiplierByThreeTile(letterPos.x, letterPos.y);
            this.drawMultiplierIcon(GridService.squareWidth * x, GridService.squareHeight * y, 3);
            this.drawMultiplierType(GridService.squareWidth * x, GridService.squareHeight * y, 'MOT');
        });
    }

    drawBasicTile(x: number, y: number) {
        this.gridContext.fillStyle = '#D2CCB8';
        this.gridContext.fillRect(x, y, GridService.squareWidth, GridService.squareHeight);
        this.gridContext.strokeStyle = '#F9F7F2';
        this.gridContext.lineWidth = 1;
        this.gridContext.strokeRect(x, y, GridService.squareWidth, GridService.squareHeight);
    }

    drawWordMultiplierByThreeTile(x: number, y: number) {
        this.gridContext.fillStyle = '#FE6E54';
        this.gridContext.fillRect(x, y, GridService.squareWidth, GridService.squareHeight);
        this.gridContext.strokeStyle = '#F9F7F2';
        this.gridContext.lineWidth = 1;
        this.gridContext.strokeRect(x, y, GridService.squareWidth, GridService.squareHeight);
    }

    drawWordMultiplierByTwoTile(x: number, y: number) {
        this.gridContext.fillStyle = '#F0B8B8';
        this.gridContext.fillRect(x, y, GridService.squareWidth, GridService.squareHeight);
        this.gridContext.strokeStyle = '#F9F7F2';
        this.gridContext.lineWidth = 1;
        this.gridContext.strokeRect(x, y, GridService.squareWidth, GridService.squareHeight);
    }

    drawLetterMultiplierByThreeTile(x: number, y: number) {
        this.gridContext.fillStyle = '#93CFF1';
        this.gridContext.fillRect(x, y, GridService.squareWidth, GridService.squareHeight);
        this.gridContext.strokeStyle = '#F9F7F2';
        this.gridContext.lineWidth = 1;
        this.gridContext.strokeRect(x, y, GridService.squareWidth, GridService.squareHeight);
    }

    drawLetterMultiplierByTwoTile(x: number, y: number) {
        this.gridContext.fillStyle = '#CEE7F7';
        this.gridContext.fillRect(x, y, GridService.squareWidth, GridService.squareHeight);
        this.gridContext.strokeStyle = '#F9F7F2';
        this.gridContext.lineWidth = 1;
        this.gridContext.strokeRect(x, y, GridService.squareWidth, GridService.squareHeight);
    }

    drawNumber(x: number, y: number, string: string) {
        this.gridContext.textBaseline = 'middle';
        this.gridContext.textAlign = 'center';
        this.gridContext.fillText(string, x + GridService.halfSquareWidth, y + GridService.halfSquareHeight, this.size);
    }

    drawLetterWeight(x: number, y: number, string: string) {
        this.gridContext.textBaseline = 'middle';
        this.gridContext.textAlign = 'center';
        const width = this.gridContext.measureText(string).width;
        const plusX = width * 0.9;
        const halfSize = this.size / 2;
        this.gridContext.font = this.weightSize + 'px system-ui';
        this.gridContext.fillText(string, x + GridService.halfSquareWidth + plusX, y + halfSize + GridService.halfSquareHeight, this.size);
    }

    drawLetter(x: number, y: number, char: string) {
        this.gridContext.font = this.size + 'px system-ui';
        this.gridContext.textBaseline = 'middle';
        this.gridContext.textAlign = 'center';
        this.gridContext.fillText(char, GridService.halfSquareWidth + x, GridService.halfSquareHeight + y, GridService.squareWidth);
    }

    drawLetterTile(x: number, y: number, char: string) {
        this.gridContext.lineWidth = 1;
        this.gridContext.strokeStyle = 'Black';
        const posX = (GridService.squareWidth - GridService.letterTileWidth) / 2;
        const posY = (GridService.squareHeight - GridService.letterTileHeight) / 2;
        this.gridContext.strokeRect(x + posX, y + posY, GridService.letterTileWidth, GridService.letterTileHeight);
        this.gridContext.fillStyle = 'black';
        this.drawLetter(x, y, char);
    }

    drawMultiplierIcon(x: number, y: number, multiplier: number) {
        const size = this.size * 0.6;
        this.gridContext.fillStyle = 'black';
        this.gridContext.font = size + 'px system-ui';
        this.gridContext.textBaseline = 'top';
        this.gridContext.textAlign = 'center';
        this.gridContext.fillText(
            'x ' + String(multiplier),
            GridService.halfSquareWidth + x,
            GridService.halfSquareHeight + y,
            GridService.squareWidth,
        );
    }

    drawMultiplierType(x: number, y: number, type: string) {
        const size = this.size * 0.55;
        this.gridContext.fillStyle = 'black';
        this.gridContext.font = size + 'px system-ui';
        this.gridContext.textBaseline = 'bottom';
        this.gridContext.textAlign = 'center';
        this.gridContext.fillText(type, GridService.halfSquareWidth + x, GridService.halfSquareHeight + y, GridService.squareWidth);
    }

    drawStar(cx : number, cy : number, spikes :number, outerRadius:number, innerRadius:number) {
        let rot = (Math.PI / 2) * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;
        this.gridContext.strokeStyle = 'black';
        this.gridContext.beginPath();
        this.gridContext.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            this.gridContext.lineTo(x, y);
            rot += step;
            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            this.gridContext.lineTo(x, y);
            rot += step;
        }
        this.gridContext.lineTo(cx, cy - outerRadius);
        this.gridContext.closePath();
        this.gridContext.lineWidth = 5;
        this.gridContext.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        this.gridContext.stroke();
        this.gridContext.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.gridContext.fill();
    }

    clearTile(x: number, y: number) {
        const position = this.positionXYPixel(x, y);

        this.gridContext.clearRect(position.x, position.y, GridService.squareWidth, GridService.squareHeight);
    }

    private positionXYPixel(x: number, y: number): Coord {
        return { x: GridService.squareWidth * x, y: GridService.squareHeight * y };
    }
}
