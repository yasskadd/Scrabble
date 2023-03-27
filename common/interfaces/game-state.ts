import { PlayerInformation } from './player-information';

export interface GameInfo {
    gameboard: string[];
    players: PlayerInformation[];
    activePlayer?: string;
}
