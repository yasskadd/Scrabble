import { Coordinate } from './coordinate';

export interface PlaceWordCommandInfo {
    firstCoordinate: Coordinate;
    isHorizontal: boolean | undefined;
    letters: string[];
}
