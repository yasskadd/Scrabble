import { AfterContentInit, AfterViewChecked, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ChatboxHandlerService } from '@app/services/chat/chatbox-handler.service';
import { UserService } from '@app/services/user.service';
import { Message } from '@common/interfaces/message';
import { AppRoutes } from '@app/models/app-routes';
import { WebviewWindow, WebviewWindowHandle } from '@tauri-apps/api/window';
import * as tauri from '@tauri-apps/api';
import { RustCommand, RustEvent } from '@app/models/rust-command';
import { ClientSocketService } from '@services/communication/client-socket.service';
import { SocketEvents } from '@common/constants/socket-events';
import { IUser } from '@common/interfaces/user';

@Component({
    selector: 'app-generic-chat',
    templateUrl: './generic-chat.component.html',
    styleUrls: ['./generic-chat.component.scss'],
})
export class GenericChatComponent implements AfterViewChecked, AfterContentInit {
    @ViewChild('chatbox', { static: false }) chatbox: ElementRef;
    @ViewChild('container') private scrollBox: ElementRef;
    activeTab: string;

    inputForm: FormControl;
    private lastMessage: Message;

    constructor(private chatboxHandler: ChatboxHandlerService, protected userService: UserService, private socket: ClientSocketService) {
        this.inputForm = new FormControl('');
        this.activeTab = 'joinedChats';

        if (tauri.window.getCurrent().label === 'chat') {
            tauri.window
                .getCurrent()
                .listen(RustEvent.WindowEvent, (payload) => {
                    console.log(payload);
                })
                .then();

            tauri.window.getCurrent().listen(RustEvent.UserData, (payload) => {
                console.log(payload);
                this.userService.user = payload as unknown as IUser;
                this.userService.isConnected.next(true);
            });
        }
    }

    get messages() {
        return this.chatboxHandler.messages;
    }

    get chatSession() {
        return this.chatboxHandler.chatSession;
    }

    get joinedChats() {
        return this.chatboxHandler.joinedRooms;
    }

    get allChats() {
        return this.chatboxHandler.availableRooms;
    }

    get username() {
        return this.userService.user.username;
    }

    @HostListener('click')
    clickInside() {
        this.chatbox?.nativeElement.focus();
    }

    test(): void {
        this.socket.send(SocketEvents.EnterRoomLobby);

        const cw = new WebviewWindowHandle('chat');
        cw.emit(RustEvent.WindowEvent, 'testasdajhsdkj');
    }

    ngAfterContentInit() {
        // this.chatboxHandler.resetMessage();
        this.chatbox?.nativeElement.focus();
    }

    submit() {
        this.chatboxHandler.submitMessage(this.inputForm.value);
        this.resetInput();
    }

    // submitMessage(message: string) {
    //     this.inputForm.setValue(message);
    //     this.submit();
    // }

    ngAfterViewChecked(): void {
        const lastMessage = this.chatboxHandler.messages[this.chatboxHandler.messages.length - 1];
        if (this.lastMessage !== lastMessage) {
            this.lastMessage = lastMessage;
            this.scrollToBottom();
        }
    }

    selectTab(tabName: string) {
        this.activeTab = tabName;
        // TODO: Insert get joined & all chat rooms
    }

    selectChatSession(chatRoomName: string | undefined) {
        this.chatboxHandler.chatSession = chatRoomName;
    }

    toggleWindow() {
        if (tauri.window.WebviewWindow.getByLabel('chat')) {
            this.closeWindow();
            return;
        }

        if (this.chatboxHandler.chatSession) {
            this.invokeChatWindow(`${AppRoutes.Chat}/${this.chatboxHandler.chatSession}`);
        } else {
            this.invokeChatWindow(`${AppRoutes.Chat}`);
        }
    }

    private resetInput() {
        this.inputForm.setValue('');
    }

    private scrollToBottom(): void {
        this.scrollBox.nativeElement.scrollTop = this.scrollBox.nativeElement.scrollHeight;
    }

    private invokeChatWindow(url: string): void {
        const chatWindow = new WebviewWindow('chat', {
            url: '#/' + url,
        });

        chatWindow
            .once('tauri://created', () => {
                console.log('window created');
                tauri.invoke(RustCommand.ChatWindowListening).then();
                setTimeout(() => {
                    tauri.window.getCurrent().emit(RustEvent.UserData, this.userService.user);
                }, 1000);
            })
            .then();
    }

    private closeWindow(): void {
        const chatWindow = WebviewWindow.getByLabel('chat');
        chatWindow.close().then();
    }
}
