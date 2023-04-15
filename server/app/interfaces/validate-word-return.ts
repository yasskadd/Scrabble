import { Word } from '@common/classes/word.class';

export interface ValidateWordReturn {
    points: number;
    invalidWords: Word[];
}
