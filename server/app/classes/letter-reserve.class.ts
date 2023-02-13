import * as letterTypes from '@app/constants/letter-reserve';
import { Letter } from '@common/interfaces/letter';
import { Service } from 'typedi';

const NUMBER_OF_LETTERS_ON_RACK = 7;

@Service()
export class LetterReserve {
    lettersReserve: Letter[];
    constructor() {
        this.lettersReserve = this.getDefaultLetterReserve();
    }

    getDefaultLetterReserve(): Letter[] {
        const defaultLetterReserve: Letter[] = [];
        letterTypes.LETTERS.forEach((letter: Letter) => {
            defaultLetterReserve.push({ value: letter.value, quantity: letter.quantity, points: letter.points });
        });
        return defaultLetterReserve;
    }

    removeLetter(letterToRemove: Letter): void {
        this.lettersReserve.forEach((letter) => {
            if (letter.value !== letterToRemove.value) return;
            letter.quantity--;
        });
    }

    insertLetter(removedLetters: Letter[]): Letter[] {
        const updatedLetterReserve = this.lettersReserve;
        for (const letterToRemove of removedLetters) {
            const index = this.lettersReserve.findIndex((letter) => letter.value === letterToRemove.value);
            updatedLetterReserve[index].quantity++;
        }

        return updatedLetterReserve;
    }

    distributeLetter(rack: Letter[]): void {
        const tempReserve: Letter[] = [];
        for (const letter of this.lettersReserve) {
            for (let i = 0; i < letter.quantity; i++) {
                tempReserve.push(letter);
            }
        }

        this.shuffleArray(tempReserve);
        const nLetters = tempReserve.length;
        const random = Math.floor(Math.random() * nLetters);
        const randomLetter = tempReserve[random];

        this.removeLetter(randomLetter);
        rack.push(randomLetter);
    }

    removeLettersFromRack(toBeRemoved: string[], rack: Letter[]): [Letter[], Letter[]] {
        let tempRack = rack.map((letter) => {
            return letter.value;
        });

        const tempToBeRemoved: Letter[] = [];

        tempRack = tempRack.filter((letter, indx) => {
            const index = toBeRemoved.indexOf(letter);
            if (index >= 0) {
                tempToBeRemoved.push(rack[indx]);
                toBeRemoved.splice(index, 1);
            }
            return index < 0;
        });

        const updatedRack: Letter[] = [];

        for (const letter of tempRack) {
            const index = rack.findIndex((element) => {
                return element.value === letter;
            });
            updatedRack.push(rack[index]);
        }

        return [updatedRack, tempToBeRemoved];
    }

    exchangeLetter(toExchange: string[], rack: Letter[]): Letter[] {
        if (this.totalQuantity() >= NUMBER_OF_LETTERS_ON_RACK) {
            const removedLetter = this.removeLettersFromRack(toExchange, rack);
            rack = removedLetter[0];
            const newRack = this.generateLetters(removedLetter[1].length, rack);
            this.lettersReserve = this.insertLetter(removedLetter[1]);
            return newRack;
        } else {
            return rack;
        }
    }

    generateLetters(quantity: number, rack: Letter[]): Letter[] {
        for (let i = 0; i < quantity; i++) {
            this.distributeLetter(rack);
        }

        return rack;
    }

    isEmpty(): boolean {
        return this.totalQuantity() === 0;
    }

    totalQuantity(): number {
        const total = this.lettersReserve.map((letter) => {
            return letter.quantity;
        });
        return total.reduce((acc, quantity) => {
            return acc + quantity;
        });
    }

    private shuffleArray(array: Letter[]) {
        for (let i = 0; i < array.length - 1; i++) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
    }
}
