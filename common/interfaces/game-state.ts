import { Letter } from './letter';
import { Objective } from './objective';

export interface Player {
    name: string;
    score: number;
    rack: Letter[];
    objective?: Objective[];
}

export interface GameInfo {
    gameboard: string[];
    players: Player[];
    activePlayer?: string;
}
