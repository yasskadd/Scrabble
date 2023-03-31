import { HistoryEvent } from './history-event';
import { ImageInfo } from './image-info';
import { Theme } from './theme';

export interface IUser {
    email?: string;
    username: string;
    password: string;
    profilePicture?: ImageInfo;
    historyEventList: HistoryEvent[];
    language: 'en' | 'fr';
    theme: Theme;
}
