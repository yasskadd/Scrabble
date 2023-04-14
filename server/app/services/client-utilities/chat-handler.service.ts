import { UserChatRoom, UserChatRoomWithState } from '@app/interfaces/user-chat-room';
import { AccountStorageService } from '@app/services/database/account-storage.service';
import { ChatRoomsStorageService } from '@app/services/database/chat-rooms-storage.service';
import { SocketManager } from '@app/services/socket/socket-manager.service';
import { SocketEvents } from '@common/constants/socket-events';
import { ChatRoom, ChatRoomInfo } from '@common/interfaces/chat-room';
import { Message } from '@common/interfaces/message';
import * as moment from 'moment';
import { Server, Socket } from 'socket.io';
import { Service } from 'typedi';

const GAME_PREFIX = 'game';

@Service()
export class ChatHandlerService {
    private chatRooms: ChatRoomInfo[];
    private gameChatRooms: Map<string, ChatRoom>;

    constructor(
        public socketManager: SocketManager,
        private accountStorage: AccountStorageService,
        private chatRoomsStorage: ChatRoomsStorageService,
    ) {
        this.chatRooms = [];
        this.gameChatRooms = new Map();
    }

    async initConfig() {
        await this.chatRoomsStorage.getAllRooms().then((rooms) => {
            rooms.forEach((room) => {
                if (this.getChatRoom(room.name)) return;
                const messageCount = room.messages.length;
                this.chatRooms.push({
                    name: room.name,
                    messageCount,
                    readingUsers: new Set(),
                    creatorId: room.creatorId,
                    isDeletable: room.isDeletable,
                });
            });
        });
    }

    initSocketEvents(): void {
        this.socketManager.io(SocketEvents.CreateChatRoom, async (sio: Server, socket: Socket, chatRoomName: string) => {
            await this.createChatRoom(sio, socket, chatRoomName);
        });

        this.socketManager.io(SocketEvents.LeaveChatRoom, async (sio: Server, socket: Socket, chatRoomName: string) => {
            await this.leaveChatRoom(sio, socket, chatRoomName);
        });

        this.socketManager.on(SocketEvents.JoinChatRoom, async (socket: Socket, chatRoomName: string) => {
            await this.joinChatRoom(socket, chatRoomName);
        });

        this.socketManager.on(SocketEvents.JoinChatRoomSession, async (socket: Socket, chatRoomName: string) => {
            await this.joinChatRoomSession(socket, chatRoomName);
        });

        this.socketManager.on(SocketEvents.LeaveChatRoomSession, async (socket: Socket, chatRoomName: string) => {
            await this.leaveChatRoomSession(socket, chatRoomName);
        });

        this.socketManager.on(SocketEvents.SendMessage, async (socket: Socket, chatRoomName: string, msg: string) => {
            await this.sendMessage(socket, chatRoomName, msg);
        });

        this.socketManager.on(SocketEvents.GetAllChatRooms, (socket: Socket) => {
            this.getAllChatRooms(socket);
        });

        this.socketManager.onConnect((socket: Socket) => {
            this.subscribeUserToRooms(socket);
        });

        this.socketManager.onDisconnect((socket: Socket) => {
            this.leaveUserFromAllRoomSessions(socket);
        });
    }

    getChatRoomsWithState(userId: string, chatRooms: UserChatRoom[]): UserChatRoomWithState[] {
        const notificationRooms: UserChatRoomWithState[] = [];
        chatRooms.forEach((chatRoom) => {
            const room = this.getChatRoom(chatRoom.name);
            if (room === undefined) {
                this.accountStorage.deleteChatRoom(userId, chatRoom.name);
                return;
            }
            const roomWithState = { name: room.name, notified: false } as UserChatRoomWithState;
            if (chatRoom.messageCount < room.messageCount) {
                roomWithState.notified = true;
            }
            notificationRooms.push(roomWithState);
        });
        return notificationRooms;
    }

    joinGameChatRoom(socket: Socket, gameId: string) {
        const gameChatRoomName = GAME_PREFIX + gameId;
        const gameChatRoom = this.getChatRoom(gameChatRoomName);
        this.leaveUserFromAllRoomSessions(socket); // Leave client from other chatrooms
        socket.emit(SocketEvents.CreateChatRoom, gameChatRoom); // Create chatRoom on client
        this.joinChatRoom(socket, gameChatRoomName); // Add client to chatroom
        this.joinChatRoomSession(socket, gameChatRoomName); // Make him join the chatRoom
    }

    leaveGameChatRoom(socket: Socket, gameId: string) {
        const gameChatRoomName = GAME_PREFIX + gameId;
        const gameChatRoom = this.getChatRoom(gameChatRoomName);
        socket.emit(SocketEvents.DeleteChatRoom, gameChatRoom);
        socket.leave(gameChatRoomName);
    }

    createGameChatRoom(socket: Socket, gameId: string) {
        // Done
        const gameChatRoomName = GAME_PREFIX + gameId;
        const gameChatRoom = { name: gameChatRoomName, messages: [], isDeletable: false } as ChatRoom;
        this.gameChatRooms.set(gameChatRoomName, gameChatRoom);
        this.joinGameChatRoom(socket, gameId);
    }

    deleteGameChatRoom(gameId: string) {
        // Done
        const gameChatRoomName = GAME_PREFIX + gameId;
        const gameChatRoom = this.getChatRoom(gameChatRoomName);
        this.socketManager.server.in(gameChatRoomName).emit(SocketEvents.DeleteChatRoom, gameChatRoom);
        this.socketManager.deleteRoom(gameChatRoomName);
        this.gameChatRooms.delete(gameChatRoomName);
    }

    private getAllChatRooms(socket: Socket) {
        const chatRooms = this.chatRooms.map((chatRoom) => {
            return { name: chatRoom.name, creatorId: chatRoom.creatorId, isDeletable: chatRoom.isDeletable };
        });
        socket.emit(SocketEvents.GetAllChatRooms, chatRooms);
    }

    private async subscribeUserToRooms(socket: Socket) {
        const userId = this.socketManager.getUserIdFromSocket(socket) as string;
        const userData = await this.accountStorage.getUserDataFromID(userId);
        userData.chatRooms.forEach((room) => {
            if (this.getChatRoom(room.name) !== undefined) {
                socket.join(room.name);
            }
        });
    }

    private async unsubscribeAllUsersFromRoom(sio: Server, roomName: string) {
        sio.in(roomName).socketsLeave(roomName);
    }

    private async loadMessages(chatRoomName: string): Promise<ChatRoom> {
        if (this.gameChatRooms.has(chatRoomName)) {
            return this.gameChatRooms.get(chatRoomName) as ChatRoom;
        }
        const room = await this.chatRoomsStorage.getRoom(chatRoomName);
        return room;
    }

    private async createChatRoom(sio: Server, socket: Socket, chatRoomName: string) {
        const room = this.getChatRoom(chatRoomName);
        if (room !== undefined || chatRoomName.startsWith(GAME_PREFIX)) {
            socket.emit(SocketEvents.CreateChatRoomError, chatRoomName);
            return;
        }
        const userId = this.socketManager.getUserIdFromSocket(socket);
        const newChatRoom = {
            name: chatRoomName,
            messageCount: 0,
            creatorId: userId,
            readingUsers: new Set<string>(),
            isDeletable: true,
        };
        this.chatRooms.push(newChatRoom);
        await this.chatRoomsStorage.createRoom(newChatRoom);
        await this.joinChatRoom(socket, chatRoomName);
        sio.emit(SocketEvents.CreateChatRoom, newChatRoom);
    }

    private async deleteChatRoom(sio: Server, socket: Socket, chatRoomName: string) {
        const chatroom = this.getChatRoom(chatRoomName);
        if (chatroom === undefined) {
            socket.emit(SocketEvents.DeleteChatRoomNotFoundError, '');
            return;
        }
        const userId = this.socketManager.getUserIdFromSocket(socket);
        if (chatroom.creatorId !== userId || !chatroom.isDeletable) {
            socket.emit(SocketEvents.DeleteChatNotCreatorError, '');
            return;
        }
        const indexToDelete = this.chatRooms.findIndex((room) => room.name === chatRoomName);
        const deletedChatRoom = this.chatRooms.splice(indexToDelete, 1)[0];
        await this.chatRoomsStorage.deleteRoom(deletedChatRoom.name);
        this.unsubscribeAllUsersFromRoom(sio, chatRoomName);
        sio.emit(SocketEvents.DeleteChatRoom, deletedChatRoom);
    }

    private async joinChatRoom(socket: Socket, chatRoomName: string) {
        const room = this.getChatRoom(chatRoomName);
        if (room === undefined) {
            socket.emit(SocketEvents.JoinChatRoomNotFoundError, '');
            return;
        }
        const userId = this.socketManager.getUserIdFromSocket(socket) as string;
        if (!this.gameChatRooms.has(chatRoomName))
            await this.accountStorage.addChatRoom(userId, { name: room.name, messageCount: room.messageCount });
        socket.join(room.name);
        socket.emit(SocketEvents.JoinChatRoom, room);
    }

    private async leaveChatRoom(sio: Server, socket: Socket, chatRoomName: string) {
        const room = this.getChatRoom(chatRoomName);
        if (room === undefined) {
            socket.emit(SocketEvents.LeaveChatRoomNotFoundError, '');
            return;
        }
        const userId = this.socketManager.getUserIdFromSocket(socket) as string;
        await this.accountStorage.deleteChatRoom(userId, room.name);
        if (room.creatorId === userId) {
            this.deleteChatRoom(sio, socket, chatRoomName);
        }
        socket.leave(room.name);
        socket.emit(SocketEvents.LeaveChatRoom, room);
    }

    private async joinChatRoomSession(socket: Socket, chatRoomName: string) {
        const room = this.getChatRoom(chatRoomName);
        if (room === undefined) {
            socket.emit(SocketEvents.JoinChatRoomSessionNotFoundError, '');
            return;
        }
        const userId = this.socketManager.getUserIdFromSocket(socket) as string;
        if (!this.gameChatRooms.has(chatRoomName)) room.readingUsers.add(userId);
        const chatRoomSession = await this.loadMessages(chatRoomName);
        socket.emit(SocketEvents.JoinChatRoomSession, chatRoomSession);
    }

    private async leaveChatRoomSession(socket: Socket, chatRoomName: string) {
        const room = this.getChatRoom(chatRoomName);
        if (room === undefined) {
            socket.emit(SocketEvents.LeaveChatRoomSessionNotFoundError, '');
            return;
        }

        if (this.gameChatRooms.has(chatRoomName)) {
            socket.emit(SocketEvents.LeaveChatRoomSession, '');
            return;
        }

        const userId = this.socketManager.getUserIdFromSocket(socket) as string;
        if (room.readingUsers.has(userId)) {
            room.readingUsers.delete(userId);
            await this.accountStorage.updateChatRoomMessageCount(userId as string, chatRoomName, room.messageCount);
            socket.emit(SocketEvents.LeaveChatRoomSession, '');
        } else {
            socket.emit(SocketEvents.LeaveChatRoomSessionNotFoundError, '');
        }
    }

    private leaveUserFromAllRoomSessions(socket: Socket) {
        const userId = this.socketManager.getUserIdFromSocket(socket) as string;
        for (const room of this.chatRooms) {
            if (!room.readingUsers.has(userId)) continue;
            this.accountStorage.updateChatRoomMessageCount(userId as string, room.name, room.messageCount);
            room.readingUsers.delete(userId);
        }
    }

    private async sendMessage(socket: Socket, chatRoomName: string, msg: string) {
        const userId = this.socketManager.getUserIdFromSocket(socket) as string;
        const momentDate = moment(new Date());
        const formattedDate: string = momentDate.format('HH:mm:ss YYYY-MM-DD');
        const newMessage: Message = { userId, message: msg, date: formattedDate };

        await this.saveMessage(socket, chatRoomName, newMessage);
        this.socketManager.emitRoom(chatRoomName, SocketEvents.SendMessage, { newMessage, room: chatRoomName });
    }

    private async saveMessage(socket: Socket, chatRoomName: string, message: Message) {
        const room = this.getChatRoom(chatRoomName);
        if (room === undefined) {
            socket.emit(SocketEvents.SendMessageError, '');
            return;
        }
        room.messageCount++;

        if (this.gameChatRooms.has(chatRoomName)) {
            this.gameChatRooms.get(chatRoomName)?.messages.push(message);
            return;
        }

        await this.chatRoomsStorage.addMessageInRoom(chatRoomName, message);
    }

    private getChatRoom(chatRoomName: string) {
        if (this.gameChatRooms.has(chatRoomName)) {
            const chatRoom = this.gameChatRooms.get(chatRoomName);
            return { name: chatRoom?.name, isDeletable: chatRoom?.isDeletable, messageCount: chatRoom?.messages.length } as ChatRoomInfo;
        }
        return this.chatRooms.find((chatRoom) => chatRoom.name === chatRoomName);
    }
}
