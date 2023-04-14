import { UserChatRoom } from '../../server/app/interfaces/user-chat-room';
import { HistoryEvent } from './history-event';
import { ImageInfo } from './image-info';
import { Theme } from './theme';

export interface IUser {
    _id: string;
    email?: string;
    username: string;
    password: string;
    profilePicture?: ImageInfo;
    chatRooms: UserChatRoom[];
    historyEventList?: HistoryEvent[];
    language?: 'en' | 'fr';
    theme?: Theme;
}
