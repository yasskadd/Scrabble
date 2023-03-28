import { Game } from '@app/classes/game.class';
import { Letter } from '@common/interfaces/letter';
import { Objective } from '@common/interfaces/objective';
import { PlayerInformation } from '@common/interfaces/player-information';
import { RoomPlayer } from '@common/interfaces/room-player';

export class GamePlayer {
    rack: Letter[];
    score: number;
    player: RoomPlayer;
    game: Game;
    objectives: Objective[];
    fiveLettersPlacedCount: number;
    clueCommandUseCount: number;

    constructor(player: RoomPlayer) {
        this.player = player;
        this.rack = [];
        this.score = 0;
        this.objectives = [];
        this.fiveLettersPlacedCount = 0;
        this.clueCommandUseCount = 0;
    }

    getInformation(): PlayerInformation {
        return {
            player: this.player,
            score: this.score,
            rack: this.rack,
            gameboard: this.game.gameboard.toStringArray(),
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
