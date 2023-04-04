import { RealPlayer } from '@app/classes/player/real-player.class';
import { Word } from '@app/classes/word.class';
import { RackService } from '@app/services/rack.service';
import { PlaceWordCommandInfo } from '@common/interfaces/place-word-command-info';
import { Service } from 'typedi';

export enum ErrorType {
    CommandCoordinateOutOfBounds = 'Placement invalide pour la premiere coordonnée',
    LettersNotInRack = 'Les lettres ne sont pas dans le chavalet',
    InvalidFirstWordPlacement = "Le mot doit être attaché à un autre mot (ou passer par la case du milieu si c'est le premier tour)",
    InvalidWordBuild = "Le mot ne possède qu'une lettre OU les lettres en commande sortent du plateau",
    WrongTurn = 'wrong turn',
    UndefinedGame = 'undefined game',
}

@Service()
export class GameValidationService {
    constructor(private rackService: RackService) {}

    verifyPlaceWordCommand(player: RealPlayer, commandInfo: PlaceWordCommandInfo): Word | ErrorType {
        const game = player.game;

        console.log('received letters:' + commandInfo.letters);

        if (game === undefined) return ErrorType.UndefinedGame;

        if (commandInfo.letters.length === 1) commandInfo.isHorizontal = undefined;

        if (!game.turn.validating(player.player.user.username)) return ErrorType.WrongTurn;

        if (!this.rackService.areLettersInRack(commandInfo.letters, player)) return ErrorType.LettersNotInRack;
        const validationInfo = game.letterPlacement.verifyWordPlacement(commandInfo, game.gameboard);

        if (validationInfo instanceof Word) return validationInfo;

        // Error
        game.turn.resetSkipCounter();
        return validationInfo;
    }
}
