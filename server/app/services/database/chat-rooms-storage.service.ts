import { Message } from '@common/interfaces/message';
import { Document } from 'mongodb';
import { Service } from 'typedi';
import { DatabaseService } from './database.service';

interface ChatRoom {
    name: string;
    messages: Message[];
}

@Service()
export class ChatRoomsStorageService {
    constructor(private databaseService: DatabaseService) {}

    async getRooms(rooms: string[]): Promise<Document[]> {
        const chatRooms = await this.databaseService.chatRooms.fetchDocuments({ name: { $in: rooms } });
        return chatRooms;
    }

    async createRoom(roomName: string) {
        const room: ChatRoom = { name: roomName, messages: [] };
        await this.databaseService.chatRooms.addDocument(room);
    }

    async deleteRoom(roomName: string) {
        await this.databaseService.chatRooms.removeDocument({ name: roomName });
    }

    async addMessageInRoom(roomName: string, message: Message) {
        await this.databaseService.chatRooms.updateDocument({ name: roomName }, { $push: { messages: message } });
    }

    async roomExists(roomName: string): Promise<boolean> {
        return (await this.databaseService.chatRooms.collection?.findOne({ name: roomName })) !== null;
    }
}
