import { ImageInfo } from './image-info';
import { Message } from './message';

export interface ChatRoom {
    name: string;
    creatorId?: string;
    isDeletable: boolean;
    messages: Message[];
}

export interface ChatRoomInfo {
    name: string;
    messageCount: number;
    creatorId?: string;
    readingUsers: Set<string>;
    isDeletable: boolean;
}

export interface ChatRoomUser {
    username: string;
    imageUrl: string;
}

export interface ChatRoomUserInfo {
    username: string;
    profilePicture: ImageInfo;
}
