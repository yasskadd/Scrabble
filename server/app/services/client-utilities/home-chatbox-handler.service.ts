import { UserChatRoom } from '@app/interfaces/user-chat-room';
import { AccountStorageService } from '@app/services/database/account-storage.service';
import { ChatRoomsStorageService } from '@app/services/database/chat-rooms-storage.service';
import { SocketManager } from '@app/services/socket/socket-manager.service';
import { SocketEvents } from '@common/constants/socket-events';
import { ChatRoom } from '@common/interfaces/chat-room';
import { Message } from '@common/interfaces/message';
import * as moment from 'moment';
import { Server, Socket } from 'socket.io';
import { Service } from 'typedi';

// type HomeRoom = Pick<GameRoom, 'id' | 'isAvailable'> & { userMap: Map<string, string>; usernameSet: Set<string> };
const NOT_FOUND = -1;
// interface HomeRoom {
//     id: string;
//     userMap: Map<string, string>;
//     usernameSet: Set<string>;
//     isAvailable: boolean;
// }
interface ChatRoomInfo {
    name: string;
    messageCount: number;
    creatorId?: string;
    readingUsers: string[];
}

// const ROOM_LIMIT = 1000;

@Service()
export class HomeChatBoxHandlerService {
    // private homeRoom: HomeRoom;
    // private messageList: ChatboxMessage[];

    private chatRooms: ChatRoomInfo[];
    private gameChatRooms: Set<string>;

    constructor(
        public socketManager: SocketManager,
        private accountStorage: AccountStorageService,
        private chatRoomsStorage: ChatRoomsStorageService,
    ) {
        this.chatRooms = [{ name: 'main', messageCount: 0, readingUsers: [] }];
    }

    initSocketEvents(): void {
        this.socketManager.io(SocketEvents.CreateChatRoom, async (sio: Server, socket: Socket, chatRoomName: string) => {
            await this.createChatRoom(sio, socket, chatRoomName);
        });

        this.socketManager.io(SocketEvents.DeleteChatRoom, async (sio: Server, socket: Socket, chatRoomName: string) => {
            await this.deleteChatRoom(sio, socket, chatRoomName);
        });

        this.socketManager.on(SocketEvents.JoinChatRoom, async (socket: Socket, chatRoomName: string) => {
            await this.joinChatRoom(socket, chatRoomName);
        });

        this.socketManager.on(SocketEvents.LeaveChatRoom, async (socket: Socket, chatRoomName: string) => {
            await this.leaveChatRoom(socket, chatRoomName);
        });

        this.socketManager.on(SocketEvents.JoinChatRoomSession, async (socket: Socket, chatRoomName: string) => {
            await this.joinChatRoomSession(socket, chatRoomName);
        });

        this.socketManager.on(SocketEvents.LeaveChatRoomSession, async (socket: Socket, chatRoomName: string) => {
            await this.leaveChatRoomSession(socket, chatRoomName);
        });

        this.socketManager.on(SocketEvents.SendMessage, async (socket: Socket, chatRoomName: string, message: Message) => {
            await this.sendMessage(socket, chatRoomName, message);
        });

        this.socketManager.on(SocketEvents.GetAllChatRooms, (socket: Socket) => {
            this.getAllChatRooms(socket);
        });

        // this.socketManager.io(SocketEvents.UserLeftRoom, (sio: Server, socket: Socket) => {
        //     this.leaveRoom(sio, socket);
        // });
        // this.socketManager.io(SocketEvents.Disconnect, (sio: Server, socket: Socket) => {
        //     this.leaveRoom(sio, socket);
        // });
    }

    checkForChatNotification(chatRooms: UserChatRoom[]): string[] {
        const notificationRooms: string[] = [];
        chatRooms.forEach((chatRoom) => {
            const room = this.isChatRoomExist(chatRoom.name) as ChatRoomInfo;
            if (chatRoom.messageCount < room.messageCount) {
                notificationRooms.push(room.name);
            }
        });
        return notificationRooms;
    }

    getAllChatRooms(socket: Socket) {
        const chatRooms = this.chatRooms.map((chatRoom) => {
            return { name: chatRoom.name, creatorId: chatRoom.creatorId };
        });
        socket.emit(SocketEvents.GetAllChatRooms, chatRooms);
    }

    makeUsersJoinGameChatRoom(socketIds: string[], gameId: string) {
        const newGameChatRoomName = this.createGameChatRoom(gameId);
        socketIds.forEach((socketId) => {
            const socket: Socket = this.socketManager.getSocketFromId(socketId) as Socket;
            socket.join(newGameChatRoomName);
        });
    }

    deleteGameChatRoom(gameId: string) {
        const gameChatRoomName = 'game' + gameId;
        this.socketManager.deleteRoom(gameChatRoomName);
        this.gameChatRooms.delete(gameChatRoomName);
    }

    private async loadMessages(chatRoomName: string): Promise<ChatRoom> {
        // const allUsersData = await this.accountStorage.getAllUsersData();
        const room = await this.chatRoomsStorage.getRoom(chatRoomName);
        // room.messages.map((message) => {
        //     message.username = allUsersData[message.userId];
        // });
        return room;
    }
    private async createChatRoom(sio: Server, socket: Socket, chatRoomName: string) {
        const room = this.isChatRoomExist(chatRoomName);
        if (room !== undefined) {
            socket.emit(SocketEvents.CreateChatRoomError, '');
            return;
        }
        const userId = this.socketManager.getUserIdFromSocket(socket);
        const newChatRoom = { name: chatRoomName, messageCount: 0, creatorId: userId, readingUsers: [] };
        this.chatRooms.push(newChatRoom);
        await this.chatRoomsStorage.createRoom(chatRoomName);
        sio.emit(SocketEvents.CreateChatRoom, newChatRoom);
    }

    private async deleteChatRoom(sio: Server, socket: Socket, chatRoomName: string) {
        if (this.isChatRoomExist(chatRoomName) === undefined) {
            socket.emit(SocketEvents.DeleteChatRoomNotFoundError, '');
            return;
        }
        const userId = this.socketManager.getUserIdFromSocket(socket);
        const index = this.chatRooms.findIndex((chatRoom) => chatRoom.name === 'main' && chatRoom.creatorId === userId);
        if (index === NOT_FOUND) {
            socket.emit(SocketEvents.DeleteChatNotCreatorError, '');
            return;
        }
        const deletedChatRoom = this.chatRooms.splice(index, 1)[0];
        await this.chatRoomsStorage.deleteRoom(deletedChatRoom.name);
        sio.emit(SocketEvents.DeleteChatRoom, deletedChatRoom);
    }

    private async joinChatRoom(socket: Socket, chatRoomName: string) {
        const room = this.isChatRoomExist(chatRoomName);
        if (room === undefined) {
            socket.emit(SocketEvents.JoinChatRoomNotFoundError, '');
            return;
        }
        const userId = this.socketManager.getUserIdFromSocket(socket) as string;
        await this.accountStorage.addChatRoom(userId, { name: room.name, messageCount: room.messageCount });
        socket.join(room.name);
        socket.emit(SocketEvents.JoinChatRoom, room);
    }

    private async leaveChatRoom(socket: Socket, chatRoomName: string) {
        const room = this.isChatRoomExist(chatRoomName);
        if (room === undefined) {
            socket.emit(SocketEvents.LeaveChatRoomNotFoundError, '');
            return;
        }
        const userId = this.socketManager.getUserIdFromSocket(socket) as string;
        await this.accountStorage.deleteChatRoom(userId, room.name);
        socket.leave(room.name);
        socket.emit(SocketEvents.LeaveChatRoom, room);
    }

    private async joinChatRoomSession(socket: Socket, chatRoomName: string) {
        const room = this.isChatRoomExist(chatRoomName);
        if (room === undefined) {
            socket.emit(SocketEvents.JoinChatRoomSessionNotFoundError, '');
            return;
        }
        const userId = this.socketManager.getUserIdFromSocket(socket) as string;
        room.readingUsers.push(userId);
        const chatRoomSession = await this.loadMessages(chatRoomName);
        socket.emit(SocketEvents.JoinChatRoomSession, chatRoomSession);
    }

    private async leaveChatRoomSession(socket: Socket, chatRoomName: string) {
        const room = this.isChatRoomExist(chatRoomName);
        if (room === undefined) {
            socket.emit(SocketEvents.LeaveChatRoomSessionNotFoundError, '');
            return;
        }

        const userId = this.socketManager.getUserIdFromSocket(socket);
        const userIdIndex = room.readingUsers.findIndex((id) => {
            return id === userId;
        });
        if (userIdIndex !== NOT_FOUND) {
            room.readingUsers.splice(userIdIndex, 1);
            await this.accountStorage.updateChatRoomMessageCount(userId as string, chatRoomName, room.messageCount);
            socket.emit(SocketEvents.LeaveChatRoomSession, '');
        } else {
            socket.emit(SocketEvents.LeaveChatRoomSessionNotFoundError, '');
        }
    }

    private async sendMessage(socket: Socket, chatRoomName: string, message: Message) {
        const momentDate = moment(new Date());
        const formattedDate: string = momentDate.format('HH:mm:ss YYYY-MM-DD');
        const newMessage: Message = { userId: message.userId, message: message.message, date: formattedDate };
        message.date = formattedDate;

        if (!chatRoomName.startsWith('game')) await this.saveMessage(socket, chatRoomName, newMessage);
        this.socketManager.emitRoom(chatRoomName, SocketEvents.SendMessage, message);
    }

    private async saveMessage(socket: Socket, chatRoomName: string, message: Message) {
        const room = this.isChatRoomExist(chatRoomName);
        if (room === undefined) {
            socket.emit(SocketEvents.SendMessageError, '');
            return;
        }
        room.messageCount++;
        await this.chatRoomsStorage.addMessageInRoom(chatRoomName, message);
    }

    private isChatRoomExist(chatRoomName: string) {
        return this.chatRooms.find((chatRoom) => chatRoom.name === chatRoomName);
    }

    private createGameChatRoom(gameId: string) {
        const gameChatRoomName = 'game' + gameId;
        this.gameChatRooms.add(gameChatRoomName);
        return gameChatRoomName;
    }

    // private initGameRoom(): void {
    //     const roomID = uuid.v4();
    //     this.homeRoom = {
    //         id: roomID,
    //         userMap: new Map<string, string>(),
    //         isAvailable: true,
    //         usernameSet: new Set(),
    //     } as HomeRoom;
    // }

    // private joinHomeRoom(sio: Server, socket: Socket, username: string): void {
    //     if (this.userMap.has(socket.id)) {
    //         // Because already connected
    //         this.notifyAlreadyConnected(socket, username);
    //     }
    //     if (this.usernameSet.has(username)) {
    //         this.notifyInvalidUsername(socket, username);
    //         return;
    //     }
    //     if (!this.homeRoom.isAvailable) {
    //         this.notifyClientFullRoom(socket);
    //         return;
    //     }
    //     // eslint-disable-next-line no-console
    //     console.log(`${username} has joined`);
    //     this.userMap.set(socket.id, username);
    //     this.usernameSet.add(username);
    //     socket.join(this.homeRoom.id);
    //     this.notifyUserJoinedRoom(sio, username, this.homeRoom.id);
    //     this.setIsAvailable();
    // }

    // private setIsAvailable(): void {
    //     this.homeRoom.isAvailable = this.userMap.size < ROOM_LIMIT;
    // }

    // private notifyAlreadyConnected(socket: Socket, username: string): void {
    //     socket.emit(SocketEvents.UserConnected, username);
    // }

    // // Notify sender
    // private notifyInvalidUsername(socket: Socket, username: string): void {
    //     socket.emit(SocketEvents.UsernameTaken, username);
    // }

    // private notifyClientFullRoom(socket: Socket): void {
    //     socket.emit(SocketEvents.RoomIsFull);
    // }

    // // Notify everyone except sender
    // private broadCastMessage(socket: Socket, message: ChatboxMessage) {
    //     // TODO: Send message with username (need to decide which format)
    //     socket.broadcast.to(this.homeRoom.id).emit(SocketEvents.ReceiveHomeMessage, message);
    // }

    // private leaveRoom(sio: Server, socket: Socket): void {
    //     if (this.userMap.has(socket.id)) {
    //         const username: string = this.userMap.get(socket.id) as string;
    //         this.userMap.delete(socket.id);
    //         this.usernameSet.delete(username);
    //         this.setIsAvailable();
    //         this.notifyUserQuittedRoom(sio, username, this.homeRoom.id);
    //         // socket.broadcast.to(this.homeRoom.id).emit(SocketEvents.UserLeftHomeRoom, username);
    //         socket.leave(this.homeRoom.id);
    //     }
    // }

    // // Notify everyone
    // private notifyUserJoinedRoom(sio: Server, username: string, roomID: string): void {
    //     sio.sockets.to(roomID).emit(SocketEvents.UserJoinedRoom, username);
    // }

    // private notifyUserQuittedRoom(sio: Server, username: string, roomID: string): void {
    //     sio.sockets.to(roomID).emit(SocketEvents.UserLeftHomeRoom, username);
    // }

    // // Getters and setters
    // get userMap(): Map<string, string> {
    //     return this.homeRoom.userMap;
    // }

    // get usernameSet(): Set<string> {
    //     return this.homeRoom.usernameSet;
    // }
}
