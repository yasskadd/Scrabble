import { GamePlayer } from './player.class';

export class RealPlayer extends GamePlayer {
    exchangeLetter(letters: string[]) {
        if (this.game === undefined) return;
        this.rack = this.game.exchange(letters, this);
    }
    skipTurn() {
        if (this.game === undefined) return;
        this.game.skip(this.player.user.username);
    }
}
