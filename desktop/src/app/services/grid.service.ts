import { Injectable } from '@angular/core';
import * as constants from '@app/constants/board-view';
import * as multipliers from '@common/constants/board-multiplier-coords';
import { Coordinate } from '@common/interfaces/coordinate';
import { Letter } from '@common/interfaces/letter';
import { LetterTileInterface } from '@common/interfaces/letter-tile-interface';

@Injectable({
    providedIn: 'root',
})
export class GridService {
    static squareWidth = constants.GRID_CANVAS_WIDTH / constants.TOTAL_COLUMNS;
    static squareHeight = constants.GRID_CANVAS_HEIGHT / constants.TOTAL_ROWS;
    static letterTileWidth = GridService.squareWidth * constants.LETTER_TILE_RATIO;
    static letterTileHeight = GridService.squareHeight * constants.LETTER_TILE_RATIO;
    static halfSquareWidth = GridService.squareWidth / 2;
    static halfSquareHeight = GridService.squareHeight / 2;
    static middlePosWidth = GridService.squareWidth * constants.MIDDLE_POSITION;
    static middlePosHeight = GridService.squareHeight * constants.MIDDLE_POSITION;

    letterSize: number;
    gridContext: CanvasRenderingContext2D;

    private boardTileSize: number;
    constructor() {
        this.letterSize = constants.FONT_SIZE;
        this.boardTileSize = constants.BOARD_TILE_SIZE;
    }

    drawGrid(gameboard: LetterTileInterface[]) {
        this.gridContext.clearRect(0, 0, constants.GRID_CANVAS_WIDTH, constants.GRID_CANVAS_HEIGHT);
        this.drawRowNumbers();
        this.drawColumnLetters();
        this.drawBasicTiles();
        this.drawMultipliers();
        this.drawMiddleTile();
        gameboard.forEach((letterTile) => {
            if (!letterTile.isOccupied) return;
            this.gridContext.fillStyle = '#52B7BE';
            this.fillTile({ x: letterTile.coordinate.x, y: letterTile.coordinate.y });
            // Reason : underscore indicates private attribute server side
            // eslint-disable-next-line no-underscore-dangle
            this.drawLetter({ x: letterTile.coordinate.x, y: letterTile.coordinate.y }, letterTile._letter.toUpperCase());
            this.drawLetterPoints({ x: letterTile.coordinate.x, y: letterTile.coordinate.y }, String(letterTile.points));
        });
    }

    drawStar() {
        let rotation = (Math.PI / 2) * 3;
        let x = GridService.middlePosWidth + GridService.halfSquareWidth;
        let y = GridService.middlePosHeight + GridService.halfSquareHeight;
        const step = Math.PI / constants.SPIKES;
        this.gridContext.strokeStyle = 'black';
        this.gridContext.beginPath();
        this.gridContext.moveTo(
            GridService.middlePosWidth + GridService.halfSquareWidth,
            GridService.middlePosHeight + GridService.halfSquareHeight - constants.OUTER_RADIUS,
        );
        for (let i = 0; i < constants.SPIKES; i++) {
            x = GridService.middlePosWidth + GridService.halfSquareWidth + Math.cos(rotation) * constants.OUTER_RADIUS;
            y = GridService.middlePosHeight + GridService.halfSquareHeight + Math.sin(rotation) * constants.OUTER_RADIUS;
            this.gridContext.lineTo(x, y);
            rotation += step;
            x = GridService.middlePosWidth + GridService.halfSquareWidth + Math.cos(rotation) * constants.INNER_RADIUS;
            y = GridService.middlePosHeight + GridService.halfSquareHeight + Math.sin(rotation) * constants.INNER_RADIUS;
            this.gridContext.lineTo(x, y);
            rotation += step;
        }
        this.gridContext.lineTo(
            GridService.middlePosWidth + GridService.halfSquareWidth,
            GridService.middlePosHeight + GridService.halfSquareHeight - constants.OUTER_RADIUS,
        );
        this.gridContext.closePath();
        this.gridContext.lineWidth = 5;
        this.gridContext.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        this.gridContext.stroke();
        this.gridContext.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.gridContext.fill();
    }

    drawArrow(coords: Coordinate, isHorizontal: boolean) {
        this.gridContext.fillStyle = constants.GREEN;
        this.gridContext.strokeStyle = 'black';
        this.fillTile(coords);
        const arrow = isHorizontal ? '⇨' : '⇩';
        this.gridContext.font = GridService.squareHeight + 'px system-ui';
        this.gridContext.textAlign = 'center';
        this.gridContext.textBaseline = 'top';
        this.gridContext.fillStyle = 'black';
        this.gridContext.fillText(
            arrow,
            GridService.squareWidth * coords.x + GridService.halfSquareWidth,
            GridService.squareHeight * coords.y,
            GridService.squareWidth,
        );
    }

    drawRowNumbers() {
        this.setFontSize(this.boardTileSize);
        for (let i = 1; i < constants.TOTAL_COLUMNS; i++) {
            const position: Coordinate = { x: i, y: 0 };
            this.gridContext.fillStyle = '#7fa99b';
            this.fillTile({ x: i, y: 1 });
            this.gridContext.textBaseline = 'middle';
            this.drawText(position, String(i));
        }
    }

    drawColumnLetters() {
        const chatCode = 64;
        for (let i = 1; i < constants.TOTAL_ROWS; i++) {
            const char = String.fromCharCode(chatCode + i);
            const position: Coordinate = { x: 0, y: i };
            this.gridContext.fillStyle = '#7fa99b';
            this.fillTile({ x: 1, y: i });
            this.drawLetter(position, char);
        }
    }

    drawLetter(position: Coordinate, char: string) {
        this.setFontSize(this.letterSize);
        this.gridContext.textBaseline = 'middle';
        this.drawText(position, char);
    }

    drawUnfinalizedLetter(coordinate: Coordinate, letter: Letter) {
        this.gridContext.fillStyle = constants.GREEN;
        this.gridContext.strokeStyle = 'black';
        this.fillTile(coordinate);
        this.gridContext.fillStyle = 'black';
        this.drawLetter(coordinate, letter.value.toUpperCase());
        this.drawLetterPoints(coordinate, String(letter.points));
    }

    drawBasicTiles() {
        this.setFontSize(this.letterSize);
        for (let i = 1; i < constants.TOTAL_COLUMNS; i++) {
            for (let j = 1; j < constants.TOTAL_ROWS; j++) {
                const position: Coordinate = { x: i, y: j };
                this.gridContext.strokeStyle = '#f9f7f2';
                this.drawBasicTile(position);
            }
        }
    }

    drawBasicTile(position: Coordinate) {
        this.gridContext.fillStyle = constants.BEIGE;
        this.fillTile(position);
    }

    drawMultipliers() {
        multipliers.letterMultipliersByTwo.forEach((position) => {
            this.drawMultiplier(position, 2, 'LETTRE');
        });
        multipliers.letterMultipliersByThree.forEach((position) => {
            this.drawMultiplier(position, 3, 'LETTRE');
        });
        multipliers.wordMultipliersByTwo.forEach((position) => {
            this.drawMultiplier(position, 2, 'MOT');
        });
        multipliers.wordMultipliersByThree.forEach((position) => {
            this.drawMultiplier(position, 3, 'MOT');
        });
    }

    drawMultiplier(position: Coordinate, multiplier: number, type: string) {
        this.setTileColor(type, multiplier);
        this.fillTile(position);
        this.drawMultiplierType(position, type);
        this.drawMultiplierNumber(position, multiplier);
    }

    setTileColor(type: string, multiplier: number) {
        switch (type) {
            case 'LETTRE':
                this.gridContext.fillStyle = multiplier === 2 ? constants.LIGHT_BLUE : constants.DARK_BLUE;
                break;
            case 'MOT':
                this.gridContext.fillStyle = multiplier === 2 ? constants.PINK : constants.RED;
                break;
        }
    }

    drawMiddleTile() {
        const middlePosition: Coordinate = { x: 8, y: 8 };
        this.gridContext.fillStyle = '#f0b8b8';
        this.fillTile(middlePosition);
        this.drawStar();
    }

    fillTile(position: Coordinate) {
        this.gridContext.lineWidth = 1;
        this.gridContext.fillRect(
            GridService.squareWidth * position.x,
            GridService.squareWidth * position.y,
            GridService.squareWidth,
            GridService.squareHeight,
        );
        this.gridContext.strokeRect(
            GridService.squareWidth * position.x,
            GridService.squareWidth * position.y,
            GridService.squareWidth,
            GridService.squareHeight,
        );
    }

    drawMultiplierNumber(position: Coordinate, multiplier: number) {
        this.setFontSize(this.letterSize * constants.MULTIPLIER_NUMBER_RATIO);
        this.gridContext.textBaseline = 'top';
        this.gridContext.textAlign = 'center';
        this.drawText(position, 'x ' + String(multiplier));
    }

    drawMultiplierType(position: Coordinate, type: string) {
        this.setFontSize(this.letterSize * constants.MULTIPLIER_TYPE_RATIO);
        this.gridContext.textBaseline = 'bottom';
        this.gridContext.textAlign = 'center';
        this.drawText(position, type);
    }

    drawText(position: Coordinate, content: string) {
        this.gridContext.fillStyle = 'black';
        this.gridContext.textAlign = 'center';
        content.toUpperCase();
        this.gridContext.fillText(
            content,
            GridService.squareWidth * position.x + GridService.halfSquareWidth,
            GridService.squareHeight * position.y + GridService.halfSquareHeight,
            GridService.squareWidth,
        );
    }

    setFontSize(size: number) {
        this.gridContext.font = size + 'px system-ui';
    }

    drawLetterPoints(position: Coordinate, string: string) {
        const weightSize = this.letterSize * constants.LETTER_WEIGHT_RATIO;
        this.setFontSize(weightSize);
        this.gridContext.fillStyle = 'black';
        this.gridContext.textAlign = 'center';
        this.gridContext.textBaseline = 'middle';
        const quarterSquareWidth = GridService.halfSquareWidth / 2;
        const halfSize = weightSize / 2;
        this.gridContext.fillText(
            string,
            GridService.squareWidth * position.x + GridService.halfSquareWidth + quarterSquareWidth,
            GridService.squareHeight * position.y + halfSize + GridService.halfSquareHeight,
            GridService.halfSquareWidth,
        );
    }

    getPosition(coords: Coordinate): Coordinate {
        return { x: Math.floor(coords.x / GridService.squareWidth), y: Math.floor(coords.y / GridService.squareWidth) };
    }
}
