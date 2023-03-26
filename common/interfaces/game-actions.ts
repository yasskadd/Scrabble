import { Coordinate } from './coordinate';

export interface ViewUpdateInfo {
    gameboard: string[];
    activePlayer: string | undefined;
}

export interface ExchangePublicInfo {
    letterAmount: number;
    player: string | undefined;
}

export interface PlaceWordCommandInfo {
    firstCoordinate: Coordinate;
    isHorizontal: boolean | undefined;
    letters: string[];
}
