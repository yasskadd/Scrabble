import { Objective } from '@common/interfaces/objective';
const descOneVowel = 'Former un mot comportant une seule voyelle avec minimum 4 lettres';
const descPalindromicWord = 'Former un palindrome avec un minimum de 3 lettres';
const descAlphabeticalWord = 'Former un mot avec les lettres placées en ordre alphabétique';
const descMoreThan10Letters = 'Former un mot ayant plus de 10 lettres';
const descClueCommand = 'Jouer une partie sans utiliser la commande indice';
const descFiveLettersPlacedTwice = 'Placer 5 lettres ou plus 2 tours de suite';
const descThreeWordsFormed = 'Placer 3 mots ou plus en un seul tour';
const descTwoSameWords = 'Placer 2 mots pareils collés en un seul tour';

export const oneVowelWord: Objective = { name: 'Mot avec une voyelle', points: 15, type: 'Word', description: descOneVowel } as Objective;
export const palindromicWord: Objective = {
    name: 'Palindrome',
    points: 0,
    type: 'Word',
    description: descPalindromicWord,
    multiplier: 'x2 pour le mot',
} as Objective;
export const alphabeticalWord: Objective = { name: 'Mot alphabétique', points: 20, type: 'Word', description: descAlphabeticalWord } as Objective;
export const moreThan10Letters: Objective = {
    name: 'Mot de 10 lettres',
    points: 20,
    type: 'Word',
    description: descMoreThan10Letters,
} as Objective;
export const threeWordsFormed: Objective = {
    name: '3 mots en 1 tour',
    points: 0,
    type: 'Word',
    description: descThreeWordsFormed,
    multiplier: 'x2 pour le tour',
} as Objective;
export const twoSameWords: Objective = { name: '2 fois le même mot', points: 20, type: 'Word', description: descTwoSameWords } as Objective;
export const fiveLettersPlacedTwice: Objective = {
    name: '5 lettres placées 2 fois',
    points: 20,
    type: 'Turn',
    description: descFiveLettersPlacedTwice,
} as Objective;
export const clueCommandNeverUsed: Objective = {
    name: 'Indice jamais utilisé',
    points: 45,
    type: 'ClueCommand',
    description: descClueCommand,
} as Objective;
export const objectivesList: Objective[] = [
    oneVowelWord,
    palindromicWord,
    alphabeticalWord,
    moreThan10Letters,
    threeWordsFormed,
    twoSameWords,
    fiveLettersPlacedTwice,
    clueCommandNeverUsed,
];
