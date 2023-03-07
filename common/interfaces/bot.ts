import { VirtualPlayerDifficulty } from '@common/models/virtual-player-difficulty';

export interface Bot {
    username: string;
    difficulty: VirtualPlayerDifficulty;
}
