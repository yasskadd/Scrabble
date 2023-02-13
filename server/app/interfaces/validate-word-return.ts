import { Word } from '@app/classes/word.class';

export interface ValidateWordReturn {
    points: number;
    invalidWords: Word[];
}
