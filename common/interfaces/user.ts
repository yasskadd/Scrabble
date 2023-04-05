import { HistoryEvent } from './history-event';
import { ImageInfo } from './image-info';
import { Theme } from './theme';

export interface IUser {
    _id: string;
    email?: string;
    username: string;
    password: string;
    profilePicture?: ImageInfo;
    chatRooms: string[];
    historyEventList?: HistoryEvent[];
    language?: 'en' | 'fr';
    theme?: Theme;
}
