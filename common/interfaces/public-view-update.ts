import { LetterTile } from '../classes/letter-tile.class';
import { IUser } from './user';

export interface PublicViewUpdate {
    gameboard: LetterTile[];
    // TODO : Remove the "| string"
    activePlayer: IUser | string;
}
