import { AfterContentInit, AfterViewChecked, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { DialogBoxCreateChatComponent } from '@app/components/dialog-box-create-chat/dialog-box-create-chat.component';
import { AppRoutes } from '@app/models/app-routes';
import { RustCommand, RustEvent } from '@app/models/rust-command';
import { ChatboxHandlerService } from '@app/services/chat/chatbox-handler.service';
import { LanguageService } from '@app/services/language.service';
import { SnackBarService } from '@app/services/snack-bar.service';
import { UserService } from '@app/services/user.service';
import { SocketEvents } from '@common/constants/socket-events';
import { IUser } from '@common/interfaces/user';
import { ClientSocketService } from '@services/communication/client-socket.service';
import * as tauri from '@tauri-apps/api';
import { WebviewWindow, WebviewWindowHandle } from '@tauri-apps/api/window';

@Component({
    selector: 'app-generic-chat',
    templateUrl: './generic-chat.component.html',
    styleUrls: ['./generic-chat.component.scss'],
})
export class GenericChatComponent implements AfterViewChecked, AfterContentInit {
    @ViewChild('chatbox', { static: false }) chatbox: ElementRef;
    @ViewChild('container') private scrollBox: ElementRef;
    // chatSession: string | undefined;

    inputForm: FormControl;
    searchForm: FormControl;
    searchAllForm: FormControl;

    private lastMessage: string;

    constructor(
        public chatboxHandler: ChatboxHandlerService,
        protected userService: UserService,
        public dialog: MatDialog,
        private socket: ClientSocketService,
        private snackBarService: SnackBarService,
        private languageService: LanguageService,
    ) {
        this.inputForm = new FormControl('');
        this.searchForm = new FormControl('');
        this.searchAllForm = new FormControl('');
        // this.chatSession = undefined;
        this.inputForm = new FormControl('');
        this.lastMessage = '';

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
        if (this.inputForm.value.trim() !== '') this.chatboxHandler.submitMessage(this.inputForm.value);
        this.resetInput();
    }

    leaveRoom() {
        this.chatboxHandler.requestLeaveRoom();
    }

    createRoom(newChatRoomName: string) {
        this.chatboxHandler.requestCreateChatRoom(newChatRoomName);
    }

    // submitMessage(message: string) {
    //     this.inputForm.setValue(message);
    //     this.submit();
    // }

    ngAfterViewChecked(): void {
        const lastMessage = this.chatboxHandler.messages[this.chatboxHandler.messages.length - 1]?.date;
        if (lastMessage != undefined && this.lastMessage !== lastMessage) {
            this.lastMessage = lastMessage;
            this.scrollToBottom();
        }
    }

    selectTab(tabName: string) {
        this.chatboxHandler.selectTab(tabName);
        // TODO: Insert get joined & all chat rooms
    }

    closeChat() {
        this.chatboxHandler.onClosingRoom();
        // this.chatboxHandler.chatSession = undefined;
        // this.chatSession = undefined;
    }

    joinChatSession(chatRoomName: string) {
        this.chatboxHandler.requestJoinRoomSession(chatRoomName);
    }

    joinChat(chatRoomName: string) {
        this.chatboxHandler.requestJoinChatRoom(chatRoomName);
    }

    openCreateChatDialog(): void {
        const dialogRef = this.dialog.open(DialogBoxCreateChatComponent, {
            data: '',
        });

        dialogRef.afterClosed().subscribe((newChatRoomName) => {
            if (newChatRoomName.trim() === '') {
                this.languageService.getWord('chat.create_room.invalid').subscribe((word: string) => {
                    this.snackBarService.openError(word);
                });
                return;
            }
            if (newChatRoomName !== undefined) this.createRoom(newChatRoomName);
        });
    }

    onSearch(chatRoomName: string) {
        return chatRoomName.toLowerCase().startsWith(this.searchForm.value.toLowerCase());
    }

    onSearchAll(chatRoomName: string) {
        return chatRoomName.toLowerCase().startsWith(this.searchAllForm.value.toLowerCase());
    }

    resetSearchInput() {
        this.searchForm.setValue('');
    }

    resetSearchAllInput() {
        this.searchAllForm.setValue('');
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
