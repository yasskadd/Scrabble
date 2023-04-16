/* eslint-disable max-lines */
import { Injectable } from '@angular/core';
import { SocketEvents } from '@common/constants/socket-events';
// import { CommandInfo } from '@common/interfaces/place-word-command-info';
// import { Letter } from '@common/interfaces/letter';
import { ClientSocketService } from '@app/services/communication/client-socket.service';
// import { GameClientService } from '@app/services/game-client.service';
// import { GameConfigurationService } from '@app/services/game-configuration.service';
import { ChatRoomClient } from '@app/interfaces/chat-room-client';
import { UserChatRoom } from '@app/interfaces/user-chat-room';
import { UserService } from '@app/services/user.service';
import { ChatRoom } from '@common/interfaces/chat-room';
import { Message } from '@common/interfaces/message';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpHandlerService } from '../communication/http-handler.service';
import { LanguageService } from '../language.service';
import { SnackBarService } from '../snack-bar.service';

const NOT_FOUND = -1;

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

    _messagesSubject: BehaviorSubject<Message[]>;
    messagesObs: Observable<Message[]>;
    _chatSessionSubject: BehaviorSubject<string | undefined>;
    chatSessionObs: Observable<string | undefined>;
    _activeTabSubject: BehaviorSubject<string>;
    activeTabObs: Observable<string>;
    _allRoomsSubject: BehaviorSubject<ChatRoomClient[]>;
    allRoomsObs: Observable<ChatRoomClient[]>;
    _joinedRoomsSubject: BehaviorSubject<string[]>;
    joinedRoomsObs: Observable<string[]>;
    _notifsSubject: BehaviorSubject<string[]>;
    notifsObs: Observable<string[]>;
    _userInfoSubject: BehaviorSubject<Map<string, UserChatRoom>>;
    userInfoObs: Observable<Map<string, UserChatRoom>>;

    constructor(
        private clientSocket: ClientSocketService,
        // private gameConfiguration: GameConfigurationService,
        // private gameClient: GameClientService,
        // private commandHandler: CommandHandlerService,
        // private timerService: TimeService,
        public userService: UserService,
        private httpHandlerService: HttpHandlerService,
        private snackBarService: SnackBarService,
        private languageService: LanguageService,
    ) {
        this.messages = [];
        this.loggedIn = false;
        this.allChatRooms = [];
        this.joinedChatRooms = [];
        this.notifiedRooms = [];
        this.chatSession = undefined;
        this.userInfoHashMap = new Map();

        this._messagesSubject = new BehaviorSubject<Message[]>(this.messages);
        this.messagesObs = this._messagesSubject.asObservable();
        this._chatSessionSubject = new BehaviorSubject<string | undefined>(this.chatSession);
        this.chatSessionObs = this._chatSessionSubject.asObservable();
        this._activeTabSubject = new BehaviorSubject<string>('joinedChats');
        this.activeTabObs = this._activeTabSubject.asObservable();
        this._allRoomsSubject = new BehaviorSubject<ChatRoomClient[]>(this.availableRooms());
        this.allRoomsObs = this._allRoomsSubject.asObservable();
        this._joinedRoomsSubject = new BehaviorSubject<string[]>(this.joinedChatRooms);
        this.joinedRoomsObs = this._joinedRoomsSubject.asObservable();
        this._notifsSubject = new BehaviorSubject<string[]>(this.notifiedRooms);
        this.notifsObs = this._notifsSubject.asObservable();
        this._userInfoSubject = new BehaviorSubject<Map<string, UserChatRoom>>(this.userInfoHashMap);
        this.userInfoObs = this._userInfoSubject.asObservable();

        this.clientSocket.connected.subscribe((connected: boolean) => {
            if (connected) {
                this.configureBaseSocketFeatures();
            }
        });

        this.userService.isConnected.subscribe((connected: boolean) => {
            if (connected) {
                this.config(this.userService.user.chatRooms as UserChatRoomWithState[]);
            } else {
                this.resetConfig();
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
            this._chatSessionSubject.next(this.chatSession);
        });

        this.clientSocket.on(SocketEvents.CreateChatRoom, (newChatRoom: ChatRoomClient) => {
            this.onNewChatRoomCreated(newChatRoom);
        });

        this.clientSocket.on(SocketEvents.CreateChatRoomError, (err: string) => {
            this.createChatRoomError();
        });

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

    resetConfig() {
        this.messages = [];
        this.allChatRooms = [];
        this.joinedChatRooms = [];
        this.notifiedRooms = [];
        this.chatSession = undefined;

        this._messagesSubject.next(this.messages);
        this._chatSessionSubject.next(this.chatSession);
        this._activeTabSubject.next('joinedChats');
        this._allRoomsSubject.next(this.allChatRooms);
        this._joinedRoomsSubject.next(this.joinedChatRooms);
        this._notifsSubject.next(this.notifiedRooms);
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

    private createChatRoomError() {
        this.languageService.getWord('chat.create_room.already_exist').subscribe((word: string) => {
            this.snackBarService.openError(word);
        });
    }

    private updateJoinedRooms() {
        console.log('update');
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
            this._messagesSubject.next(this.messages);
            if (!this.userInfoHashMap.has(newMessage.userId)) this.updateUserInfoSet();
        } else {
            this.sendNotification(roomName);
        }
    }

    private sendNotification(roomName: string) {
        this.notifiedRooms.push(roomName);
        this._notifsSubject.next(this.notifiedRooms);
    }

    private joinChatRoom(chatRoom: ChatRoomClient) {
        this.joinedChatRooms.push(chatRoom.name);
        console.log('joinChatRoom');
        console.log(this.joinedChatRooms);
        this.updateJoinedRooms();
        this.updateAllRooms();
        // this.removeRoomFromAllChatRooms(chatRoom.name);
        this.requestJoinRoomSession(chatRoom.name);
    }

    private removeRoomFromJoinedChatRooms(chatRoomName: string) {
        const indexToDelete = this.joinedChatRooms.findIndex((roomName) => roomName === chatRoomName);
        this.joinedChatRooms.splice(indexToDelete, 1);
        console.log('removefromjione');
        console.log(this.joinedChatRooms);
        this.updateJoinedRooms();
        this.updateAllRooms();
    }

    private removeRoomFromAllChatRooms(chatRoomName: string) {
        const indexToDelete = this.allChatRooms.findIndex((room) => room.name === chatRoomName);
        if (indexToDelete == NOT_FOUND) return;
        this.allChatRooms.splice(indexToDelete, 1);
        this.updateJoinedRooms();
        this.updateAllRooms();
    }

    private joinRoomSession(chatRoomName: string, newMessage: Message[]) {
        this.messages = newMessage;
        this.chatSession = chatRoomName;
        this._messagesSubject.next(this.messages);
        this._chatSessionSubject.next(this.chatSession);
        const indexToDelete = this.notifiedRooms.findIndex((roomName) => roomName === chatRoomName);
        if (indexToDelete !== NOT_FOUND) {
            this.notifiedRooms.splice(indexToDelete, 1);
            this._notifsSubject.next(this.notifiedRooms);
        }
        console.log('joinsession');
        console.log(this.joinedChatRooms);
        this.updateUserInfoSet();
    }

    private updateUserInfoSet() {
        const currentlyRequested = new Set<string>();
        for (const message of this.messages) {
            const id = message.userId;
            if (!this.userInfoHashMap.has(id) && !currentlyRequested.has(id)) {
                currentlyRequested.add(id);
                this.updateUserInfo(id);
            }
        }
        this._userInfoSubject.next(this.userInfoHashMap);
    }

    private updateUserInfo(id: string) {
        this.httpHandlerService
            .getChatUserInfo(id)
            .then((userInfo: any) => {
                this.userInfoHashMap.set(id, userInfo);
            })
            .catch((e) => console.log(e));
    }

    private onNewChatRoomCreated(newChatRoom: ChatRoomClient) {
        if (this.userService.user._id !== newChatRoom.creatorId) {
            this.allChatRooms.push(newChatRoom);
            this.updateAllRooms();
        } else {
            this.snackBarService.openInfo('Room created successfully');
        }
    }

    private leaveRoom(chatRoomName: string) {
        this.removeRoomFromJoinedChatRooms(chatRoomName);
    }

    private deleteChatRoom(chatRoom: ChatRoomClient) {
        this.requestJoinRoomSession(chatRoom.name);
        this.removeRoomFromAllChatRooms(chatRoom.name);
        if (this.chatSession === chatRoom.name) {
            this.chatSession = undefined;
            this._chatSessionSubject.next(this.chatSession);
        }
    }
}
