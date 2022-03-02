import { Gameboard } from '@app/classes/gameboard.class';
import { CommandInfo } from '@app/command-info';
import { Game } from '@app/services/game.service';
import { Player } from './player.class';

export class BeginnerBot extends Player {
    game: Game;
    isPlayerOne: boolean;

    constructor(game: Game, isPlayerOne: boolean, name: string) {
        super(name);
        this.game = game;
        this.isPlayerOne = isPlayerOne;
    }

    placeLetter(commandInfo: CommandInfo): [boolean, Gameboard] | string {
        if (this.game === undefined) return 'error';
        return this.game.play(this, commandInfo);
    }

    exchangeLetter(letters: string[]) {
        if (this.game === undefined) return;
        this.rack = this.game.exchange(letters, this);
    }
    skipTurn() {
        if (this.game === undefined) return;
        this.game.skip(this.name);
    }
}
