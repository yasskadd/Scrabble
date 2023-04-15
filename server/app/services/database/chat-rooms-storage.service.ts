import { ChatRoom, ChatRoomInfo } from '@common/interfaces/chat-room';
import { Message } from '@common/interfaces/message';
import { Document } from 'mongodb';
import { Service } from 'typedi';
import { DatabaseService } from './database.service';

@Service()
export class ChatRoomsStorageService {
    constructor(private databaseService: DatabaseService) {}

    async getAllRooms(): Promise<ChatRoom[]> {
        const chatRooms = await this.databaseService.chatRooms.fetchDocuments({});
        return chatRooms as ChatRoom[];
    }

    async getRooms(rooms: string[]): Promise<Document[]> {
        const chatRooms = await this.databaseService.chatRooms.fetchDocuments({ name: { $in: rooms } });
        return chatRooms;
    }

    async getRoom(roomName: string): Promise<ChatRoom> {
        const messages = await this.databaseService.chatRooms.collection.findOne({ name: roomName });
        return messages as unknown as ChatRoom;
    }

    async createRoom(roomInfo: ChatRoomInfo) {
        const room: ChatRoom = { name: roomInfo.name, messages: [], isDeletable: roomInfo.isDeletable, creatorId: roomInfo.creatorId };
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
