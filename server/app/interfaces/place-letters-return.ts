import { Gameboard } from '@app/classes/gameboard.class';
import { Word } from '@app/classes/word.class';

export interface PlaceLettersReturn {
    hasPassed: boolean;
    gameboard: Gameboard;
    invalidWords: Word[];
}
