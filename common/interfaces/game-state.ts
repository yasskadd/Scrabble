import { Letter } from './letter';

export interface Player {
    name: string;
    score: number;
    rack: Letter[];
}

export interface GameInfo {
    gameboard: string[];
    players: Player[];
    activePlayer?: string;
}
