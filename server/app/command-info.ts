import { LetterTile } from '@common/letter-tile.class';

export interface CommandInfo {
    firstCoordinate: LetterTile;
    direction: string;
    lettersPlaced: string[];
}
