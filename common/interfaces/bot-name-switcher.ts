import { VirtualPlayerDifficulty } from '@common/models/virtual-player-difficulty';

export interface BotNameSwitcher {
    currentName: string;
    newName: string;
    difficulty: VirtualPlayerDifficulty;
}
