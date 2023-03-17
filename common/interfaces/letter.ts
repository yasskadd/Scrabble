import { AlphabetLetter } from '../models/alphabet-letter';

export interface Letter {
    value: AlphabetLetter;
    quantity: number;
    points: number;
}
