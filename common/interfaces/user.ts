import { HistoryEvent } from './history-event';
import { ImageInfo } from './image-info';
import { Theme } from './theme';

export interface IUser {
    _id: string;
    email?: string;
    username: string;
    password: string;
    profilePicture?: ImageInfo;
    score: number;
    historyEventList: HistoryEvent[];
    language: 'en' | 'fr';
    theme: Theme;
}
