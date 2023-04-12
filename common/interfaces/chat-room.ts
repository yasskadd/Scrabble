import { ImageInfo } from './image-info';
import { Message } from './message';

export interface ChatRoom {
    name: string;
    isDeletable: boolean;
    messages: Message[];
}

export interface ChatRoomUser {
    username: string;
    imageUrl: string;
}

export interface ChatRoomUserInfo {
    username: string;
    profilePicture: ImageInfo;
}
