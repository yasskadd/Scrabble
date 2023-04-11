import { Message } from './message';

export interface ChatRoom {
    name: string;
    isDeletable: boolean;
    messages: Message[];
}
