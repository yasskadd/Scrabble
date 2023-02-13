import { Game } from '@app/classes/game.class';
import { LetterTile } from '@common/classes/letter-tile.class';
import { Letter } from '@common/interfaces/letter';
import { Objective } from '@common/interfaces/objective';

type PlayerInformation = { name: string; score: number; rack: Letter[]; room: string; gameboard: LetterTile[] };

export class Player {
    rack: Letter[];
    score: number;
    name: string;
    room: string;
    game: Game;
    isPlayerOne: boolean;
    objectives: Objective[];
    fiveLettersPlacedCount: number;
    clueCommandUseCount: number;

    constructor(name: string) {
        this.rack = [];
        this.score = 0;
        this.name = name;
        this.objectives = [];
        this.fiveLettersPlacedCount = 0;
        this.clueCommandUseCount = 0;
    }

    getInformation(): PlayerInformation {
        if (this.game === undefined) return {} as PlayerInformation;
        return {
            name: this.name,
            score: this.score,
            rack: this.rack,
            room: this.room,
            gameboard: this.game.gameboard.gameboardTiles,
        };
    }

    rackIsEmpty(): boolean {
        return this.rack.length === 0;
    }

    rackToString() {
        const stringArray: string[] = [];
        this.rack.forEach((letter) => {
            stringArray.push(letter.value);
        });
        return stringArray;
    }

    deductPoints() {
        let pointsToDeduct = 0;
        for (const letter of this.rack) {
            pointsToDeduct += letter.points;
        }
        this.score -= pointsToDeduct;

        if (this.score < 0) {
            this.score = 0;
        }
    }

    addPoints(rack: Letter[]) {
        let pointsToAdd = 0;
        for (const letter of rack) {
            pointsToAdd += letter.points;
        }
        this.score += pointsToAdd;
    }
}
