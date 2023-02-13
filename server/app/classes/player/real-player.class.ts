import { Game } from '@app/classes/game.class';
import { PlaceLettersReturn } from '@app/interfaces/place-letters-return';
import { CommandInfo } from '@common/interfaces/command-info';
import { Player } from './player.class';

export class RealPlayer extends Player {
    game: Game;
    isPlayerOne: boolean;

    setGame(game: Game, isPlayerOne: boolean) {
        this.game = game;
        this.isPlayerOne = isPlayerOne;
    }

    placeLetter(commandInfo: CommandInfo): PlaceLettersReturn | string {
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
