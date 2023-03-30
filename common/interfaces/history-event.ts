import { HistoryActions } from '../models/history-actions';

export interface HistoryEvent {
    event: HistoryActions.Connection | HistoryActions.Logout | HistoryActions.Game;
    date: Date;
    gameWon?: boolean;
}
