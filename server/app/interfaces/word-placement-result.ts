import { Word } from '@common/classes/word.class';
import { Gameboard } from '@common/classes/gameboard.class';

export interface WordPlacementResult {
    hasPassed: boolean;
    gameboard: Gameboard;
    invalidWords: Word[];
}
