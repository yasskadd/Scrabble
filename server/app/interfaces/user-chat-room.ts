export interface UserChatRoom {
    name: string;
    messageCount: number;
}

export interface UserChatRoomWithState {
    name: string;
    notified: boolean;
}
