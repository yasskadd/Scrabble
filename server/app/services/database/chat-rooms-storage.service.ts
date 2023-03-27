import { Document } from 'mongodb';
import { Service } from 'typedi';
import { DatabaseService } from './database.service';

interface ChatRoom {
    name: string;
    messages: Message[];
}

interface Message {
    dateInUTC: string;
    message: string;
    userId: string;
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

    async changeRoomName(oldRoomName: string, newRoomName: string) {
        await this.databaseService.chatRooms.updateDocument({ name: oldRoomName }, { $set: { name: newRoomName } });
    }
}
