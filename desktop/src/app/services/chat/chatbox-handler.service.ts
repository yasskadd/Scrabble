/* eslint-disable max-lines */
import { Injectable } from '@angular/core';
import { SocketEvents } from '@common/constants/socket-events';
// import { CommandInfo } from '@common/interfaces/place-word-command-info';
// import { Letter } from '@common/interfaces/letter';
import { ClientSocketService } from '@app/services/communication/client-socket.service';
// import { GameClientService } from '@app/services/game-client.service';
// import { GameConfigurationService } from '@app/services/game-configuration.service';
import { ChatRoomClient } from '@app/interfaces/chat-room-client';
import { UserService } from '@app/services/user.service';
import { ChatRoom } from '@common/interfaces/chat-room';
import { Message } from '@common/interfaces/message';
import { BehaviorSubject, Observable } from 'rxjs';

const NOT_FOUND = -1;
interface UserChatRoom {
    username: string;
    imageUrl: string;
}

interface UserChatRoomWithState {
    name: string;
    notified: boolean;
}

@Injectable({
    providedIn: 'root',
})
export class ChatboxHandlerService {
    messages: Message[];
    loggedIn: boolean;
    allChatRooms: ChatRoomClient[];
    joinedChatRooms: string[];
    notifiedRooms: string[];
    chatSession: string | undefined;
    userInfoHashMap: Map<string, UserChatRoom>;

    _activeTabSubject: BehaviorSubject<string>;
    activeTabObs: Observable<string>;
    _allRoomsSubject: BehaviorSubject<ChatRoomClient[]>;
    allRoomsObs: Observable<ChatRoomClient[]>;
    _joinedRoomsSubject: BehaviorSubject<string[]>;
    joinedRoomsObs: Observable<string[]>;
    _notifsSubject: BehaviorSubject<number>;
    notifsObs: Observable<number>;

    constructor(
        private clientSocket: ClientSocketService,
        // private gameConfiguration: GameConfigurationService,
        // private gameClient: GameClientService,
        // private commandHandler: CommandHandlerService,
        // private timerService: TimeService,
        private userService: UserService, // private httpHandlerService: HttpHandlerService,
    ) {
        this.messages = [];
        this.loggedIn = false;
        this.allChatRooms = [];
        this.joinedChatRooms = [];
        this.notifiedRooms = [];
        this.chatSession = undefined;
        this.userInfoHashMap = new Map();

        this._activeTabSubject = new BehaviorSubject<string>('joinedChats');
        this.activeTabObs = this._activeTabSubject.asObservable();
        this._allRoomsSubject = new BehaviorSubject<ChatRoomClient[]>(this.availableRooms());
        this.allRoomsObs = this._allRoomsSubject.asObservable();
        this._joinedRoomsSubject = new BehaviorSubject<string[]>(this.joinedChatRooms);
        this.joinedRoomsObs = this._joinedRoomsSubject.asObservable();
        this._notifsSubject = new BehaviorSubject<number>(0);
        this.notifsObs = this._notifsSubject.asObservable();

        this.clientSocket.connected.subscribe((connected: boolean) => {
            if (connected) {
                this.configureBaseSocketFeatures();
            }
        });

        this.userService.isConnected.subscribe((connected: boolean) => {
            if (connected) {
                this.config(this.userService.user.chatRooms as UserChatRoomWithState[]);
            }
        });
    }

    get chatCurrentSession() {
        return this.chatSession;
    }

    // get joinedRooms(): ChatRoomClient[] {
    //     return this.allChatRooms.filter((allRoom) => {
    //         const indexToDelete = this.joinedChatRooms.findIndex((joinedRoom) => joinedRoom === allRoom.name);
    //         return indexToDelete !== NOT_FOUND;
    //     });
    // }

    private configureBaseSocketFeatures(): void {
        this.clientSocket.on(SocketEvents.GetAllChatRooms, (chatRooms: ChatRoomClient[]) => {
            this.allChatRooms = chatRooms;
            this.updateAllRooms();
        });

        this.clientSocket.on(SocketEvents.SendMessage, (newMessage: any) => {
            const roomName = newMessage.room;
            const message = newMessage.newMessage;
            this.treatReceivedMessage(roomName, message);
        });

        this.clientSocket.on(SocketEvents.JoinChatRoom, (chatRoom: ChatRoomClient) => {
            this.joinChatRoom(chatRoom);
        });

        this.clientSocket.on(SocketEvents.JoinChatRoomSession, (chatRoom: ChatRoom) => {
            const roomName = chatRoom.name;
            const newMessages: Message[] = chatRoom.messages;
            this.joinRoomSession(roomName, newMessages);
        });

        this.clientSocket.on(SocketEvents.LeaveChatRoomSession, (chatRoom: ChatRoom) => {
            this.chatSession = undefined;
        });

        this.clientSocket.on(SocketEvents.CreateChatRoom, (newChatRoom: ChatRoomClient) => {
            this.onNewChatRoomCreated(newChatRoom);
        });

        // this.clientSocket.on(SocketEvents.CreateChatRoomError, (err: string) {
        //     this.onRoomCreationFail(err);
        // });

        this.clientSocket.on(SocketEvents.LeaveChatRoom, (chatRoom: ChatRoomClient) => {
            this.leaveRoom(chatRoom.name);
        });

        this.clientSocket.on(SocketEvents.DeleteChatRoom, (chatRoom: ChatRoomClient) => {
            this.deleteChatRoom(chatRoom);
        });
    }

    selectTab(tabName: string) {
        this._activeTabSubject.next(tabName);
    }

    config(joinedChatRooms: UserChatRoomWithState[]) {
        for (const joinedRoom of joinedChatRooms) {
            this.joinedChatRooms.push(joinedRoom.name);
            if (joinedRoom.notified) this.notifiedRooms.push(joinedRoom.name);
        }
        this.clientSocket.send(SocketEvents.GetAllChatRooms);
    }

    requestLeaveRoom() {
        this.requestLeaveRoomSession();
        this.clientSocket.send(SocketEvents.LeaveChatRoom, this.chatSession);
    }

    requestLeaveRoomSession() {
        this.clientSocket.send(SocketEvents.LeaveChatRoomSession, this.chatSession);
    }

    requestJoinChatRoom(chatRoomName: string) {
        this.clientSocket.send(SocketEvents.JoinChatRoom, chatRoomName);
    }

    requestJoinRoomSession(chatRoomName: string) {
        this.clientSocket.send(SocketEvents.JoinChatRoomSession, chatRoomName);
    }

    requestCreateChatRoom(chatRoomName: string) {
        this.clientSocket.send(SocketEvents.CreateChatRoom, chatRoomName);
    }

    leaveChatRoom(chatRoomName: string) {
        this.clientSocket.send(SocketEvents.LeaveChatRoom, chatRoomName);
    }

    submitMessage(msg: String) {
        // TODO : Revoir si ca marche
        this.clientSocket.send(SocketEvents.SendMessage, { chatRoomName: this.chatSession, msg });
    }

    onClosingRoom() {
        this.requestLeaveRoomSession();
    }

    private updateJoinedRooms() {
        this._joinedRoomsSubject.next(this.joinedChatRooms);
    }

    private updateAllRooms() {
        this._allRoomsSubject.next(this.availableRooms());
    }

    private availableRooms(): ChatRoomClient[] {
        return this.allChatRooms.filter((allRoom) => {
            const indexToDelete = this.joinedChatRooms.findIndex((joinedRoom) => joinedRoom === allRoom.name);
            return indexToDelete === NOT_FOUND;
        });
    }

    private treatReceivedMessage(roomName: string, newMessage: Message) {
        if (this.chatSession === roomName) {
            this.messages.push(newMessage);
        } else {
            this.sendNotification(roomName, newMessage);
        }
    }

    private sendNotification(roomName: string, newMessage: Message) {
        // TODO: Handle notif
    }

    private joinChatRoom(chatRoom: ChatRoomClient) {
        this.joinedChatRooms.push(chatRoom.name);
        this.updateJoinedRooms();
        this.updateAllRooms();
        // this.removeRoomFromAllChatRooms(chatRoom.name);
        this.requestJoinRoomSession(chatRoom.name);
    }

    private removeRoomFromJoinedChatRooms(chatRoomName: string) {
        const indexToDelete = this.joinedChatRooms.findIndex((roomName) => roomName === chatRoomName);
        this.joinedChatRooms.splice(indexToDelete, 1);
        this.updateJoinedRooms();
        this.updateAllRooms();
    }

    private removeRoomFromAllChatRooms(chatRoomName: string) {
        const indexToDelete = this.allChatRooms.findIndex((room) => room.name === chatRoomName);
        this.allChatRooms.splice(indexToDelete, 1);
        this.updateJoinedRooms();
        this.updateAllRooms();
    }

    private joinRoomSession(chatRoomName: string, newMessage: Message[]) {
        this.messages = newMessage;
        this.chatSession = chatRoomName;
        // const currentlyRequested = new Set<string>();
        // for (const message of this.messages) {
        //     const id = message.userId;
        //     if (!this.userInfoHashMap.has(id) && !currentlyRequested.has(id)) {
        //         currentlyRequested.add(id);
        //         this.updateUserInfo(id);
        //     }
        // }
    }

    // private updateUserInfo(id: string) {
    //     this.httpHandlerService.getChatUserInfo(id).then((userInfo: any) => {
    //         this.userInfoHashMap.set(id, userInfo);
    //     });
    // }

    private onNewChatRoomCreated(newChatRoom: ChatRoomClient) {
        if (this.userService.user._id !== newChatRoom.creatorId) {
            this.allChatRooms.push(newChatRoom);
            this.updateAllRooms();
        }
    }

    private leaveRoom(chatRoomName: string) {
        this.removeRoomFromJoinedChatRooms(chatRoomName);
    }

    private deleteChatRoom(chatRoom: ChatRoomClient) {
        this.requestJoinRoomSession(chatRoom.name);
        this.removeRoomFromAllChatRooms(chatRoom.name);
        if (this.chatSession === chatRoom.name) this.chatSession = undefined;
    }
}
