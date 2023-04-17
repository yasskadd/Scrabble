import { AfterContentInit, AfterViewChecked, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { DialogBoxCreateChatComponent } from '@app/components/dialog-box-create-chat/dialog-box-create-chat.component';
import { AppRoutes } from '@app/models/app-routes';
import { RustEvent } from '@app/models/rust-command';
import { ChatboxHandlerService } from '@app/services/chat/chatbox-handler.service';
import { LanguageService } from '@app/services/language.service';
import { SnackBarService } from '@app/services/snack-bar.service';
import { UserService } from '@app/services/user.service';
import * as tauri from '@tauri-apps/api';
import { WebviewWindow } from '@tauri-apps/api/window';
import { Observable } from 'rxjs';

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
    focus: boolean;

    private lastMessage: string;

    constructor(
        public chatboxHandler: ChatboxHandlerService,
        protected userService: UserService,
        public dialog: MatDialog,
        private snackBarService: SnackBarService,
        private languageService: LanguageService,
    ) {
        this.focus = false;
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

    get allRooms(): Observable<any> {
        return this.chatboxHandler.allRoomsObs;
    }

    @HostListener('click')
    clickInside() {
        this.chatbox?.nativeElement.focus();
    }

    write(event: KeyboardEvent): void {
        if (event.key === 'Backspace') {
            event.preventDefault();
            let newMessage = this.inputForm.value;
            newMessage = newMessage.substring(0, this.inputForm.value.length - 1);
            this.inputForm.setValue(newMessage);
        }
        // else if (event.key !== 'Enter') {
        //     event.preventDefault();
        //     this.inputForm.setValue(this.inputForm.value + event.key);
        // }
    }

    ngAfterContentInit() {
        // this.chatboxHandler.resetMessage();
        this.chatbox?.nativeElement.focus();
    }

    submit() {
        if (this.inputForm.value.trim() !== '') this.chatboxHandler.submitMessage(this.inputForm.value);
        this.resetInput();
        this.scrollToBottom();
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
        this.scrollToBottom();
    }

    joinChat(chatRoomName: string) {
        this.chatboxHandler.requestJoinChatRoom(chatRoomName);
        this.scrollToBottom();
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

    async toggleWindow(): Promise<void> {
        if (tauri.window.WebviewWindow.getByLabel('chat')) {
            this.closeWindow();
            this.chatboxHandler.chatWindowOpened.next(false);
            return;
        }

        if (this.chatboxHandler.chatSession) {
            await this.chatboxHandler.invokeChatWindow(`${AppRoutes.Chat}/${this.chatboxHandler.chatSession}`);
        } else {
            await this.chatboxHandler.invokeChatWindow(`${AppRoutes.Chat}`);
        }
    }

    checkLeaveButton(chatSession: string) {
        const chatRoom = this.chatboxHandler.getChatRoom(chatSession);
        return chatSession !== 'main' && !chatSession.startsWith('game') && chatRoom?.creatorId !== this.chatboxHandler.userService?.user._id;
    }

    checkDeleteButton(chatSession: string) {
        const chatRoom = this.chatboxHandler.getChatRoom(chatSession);
        return (
            chatSession !== 'main' &&
            !chatSession.startsWith('game') &&
            chatRoom?.creatorId === this.chatboxHandler.userService?.user._id &&
            chatRoom.isDeletable
        );
    }

    private resetInput() {
        this.inputForm.setValue('');
    }

    private scrollToBottom(): void {
        this.scrollBox.nativeElement.scrollTop = this.scrollBox.nativeElement.scrollHeight;
    }

    private closeWindow(): void {
        tauri.event.emit(RustEvent.WindowEvent).then();
        const chatWindow = WebviewWindow.getByLabel('chat');
        chatWindow.close().then();
    }
}
