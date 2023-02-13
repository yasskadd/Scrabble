import { Player } from '@app/classes/player/player.class';
import { Letter } from '@common/interfaces/letter';
import { Service } from 'typedi';

@Service()
export class RackService {
    areLettersInRack(commandLetters: string[], player: Player): boolean {
        const tempRack: Letter[] = this.createTempRack(player);
        const lettersPresentInRack = this.findLettersPresentInRack(commandLetters, tempRack);
        return lettersPresentInRack.length === commandLetters.length;
    }

    updatePlayerRack(letters: string[], playerRack: Letter[]): void {
        const INDEX_NOT_FOUND = -1;
        letters.forEach((letter) => {
            if (letter === letter.toUpperCase()) letter = '*';
            const itemInRack = playerRack.filter((item: Letter) => item.value === letter)[0];
            const index = playerRack.indexOf(itemInRack);
            if (index > INDEX_NOT_FOUND) playerRack.splice(index, 1);
        });
    }

    createTempRack(player: Player): Letter[] {
        const tempPlayerRack: Letter[] = [];
        for (const letter of player.rack) {
            tempPlayerRack.push(letter);
        }
        return tempPlayerRack;
    }

    findLettersPresentInRack(commandLetters: string[], tempRack: Letter[]): string[] {
        const rackLetters = commandLetters.map((commandLetter) => {
            let tempCommandLetter: string = commandLetter;
            if (this.isBlankLetter(tempCommandLetter)) tempCommandLetter = '*';
            return this.findRackLetter(tempRack, tempCommandLetter);
        });

        return rackLetters.filter((letter) => letter !== undefined) as string[];
    }

    isBlankLetter(tempCommandLetter: string) {
        return tempCommandLetter === tempCommandLetter.toUpperCase();
    }

    findRackLetter(tempRack: Letter[], tempCommandLetter: string): string | undefined {
        const index = tempRack.findIndex((letterInRack) => {
            return letterInRack.value === tempCommandLetter;
        });

        if (index < 0) return;
        else {
            this.removeLetterFromTempRack(tempRack, index);
            return tempCommandLetter;
        }
    }

    private removeLetterFromTempRack(tempRack: Letter[], index: number) {
        tempRack.splice(index, 1);
    }
}
