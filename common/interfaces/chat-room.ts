import { Message } from './message';

export interface ChatRoom {
    name: string;
    messages: Message[];
}
