import { DictionaryValidation } from '@app/classes/dictionary-validation.class';
import { LetterPlacement } from '@app/classes/letter-placement.class';
import { WordSolver } from '@app/classes/word-solver.class';

export interface DictionaryContainer {
    dictionaryValidation: DictionaryValidation;
    wordSolver: WordSolver;
    letterPlacement: LetterPlacement;
}
