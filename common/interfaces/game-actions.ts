import { Coordinate } from './coordinate';

export interface ViewUpdateInfo {
    gameboard: string[];
    activePlayer: string | undefined;
}

export interface PlayCommandInfo {
    firstCoordinate: Coordinate;
    isHorizontal: boolean | undefined;
    letters: string[];
}
