import { PlayerType } from '@common/models/player-type';

export interface PlayerGameResult {
    playerId: string;
    playerType?: PlayerType;
    score: number;
}
