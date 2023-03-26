import { Word } from '@app/classes/word.class';
import { Gameboard } from '@common/classes/gameboard.class';

export interface PlaceLettersReturn {
    hasPassed: boolean;
    gameboard: Gameboard;
    invalidWords: Word[];
}
