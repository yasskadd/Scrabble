import { Coordinate } from './coordinate';

export interface CommandInfo {
    firstCoordinate: Coordinate;
    isHorizontal: boolean | undefined;
    letters: string[];
}
