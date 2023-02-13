import { Coordinate } from './coordinate';
import { Multiplier } from './multiplier';

export interface LetterTileInterface {
    coordinate: Coordinate;
    isOccupied: boolean;
    _letter: string;
    points: number;
    multiplier: Multiplier;
}
