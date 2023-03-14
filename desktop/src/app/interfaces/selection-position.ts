import { PlayDirection } from '@app/models/play-direction';

export interface SelectionPosition {
    coord: number;
    direction: PlayDirection;
}
