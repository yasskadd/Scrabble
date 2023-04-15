import { AfterContentInit, AfterViewChecked, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { DialogBoxCreateChatComponent } from '@app/components/dialog-box-create-chat/dialog-box-create-chat.component';
import { ChatboxHandlerService } from '@app/services/chat/chatbox-handler.service';
import { UserService } from '@app/services/user.service';
import { Message } from '@common/interfaces/message';

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
    searchInput: string;
    searchAllInput: string;
    private lastMessage: Message;

    constructor(public chatboxHandler: ChatboxHandlerService, protected userService: UserService, public dialog: MatDialog) {
        this.inputForm = new FormControl('');
        this.searchInput = '';
        this.searchAllInput = '';
        // this.chatSession = undefined;
    }

    get messages() {
        return this.chatboxHandler.messages;
    }

    get chatSession() {
        return this.chatboxHandler.chatSession;
    }

    @HostListener('click')
    clickInside() {
        this.chatbox?.nativeElement.focus();
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
        const lastMessage = this.chatboxHandler.messages[this.chatboxHandler.messages.length - 1];
        if (this.lastMessage !== lastMessage) {
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
            console.log(newChatRoomName);
            if (newChatRoomName !== undefined && newChatRoomName.trim() !== '') this.createRoom(newChatRoomName);
        });
    }

    onSearch(chatRoomName: string) {
        return chatRoomName.toLowerCase().startsWith(this.searchInput.toLowerCase());
    }

    onSearchAll(chatRoomName: string) {
        return chatRoomName.toLowerCase().startsWith(this.searchAllInput.toLowerCase());
    }

    resetSearchInput() {
        this.searchInput = '';
    }

    resetSearchAllInput() {
        this.searchAllInput = '';
    }

    private resetInput() {
        this.inputForm.setValue('');
    }

    private scrollToBottom(): void {
        this.scrollBox.nativeElement.scrollTop = this.scrollBox.nativeElement.scrollHeight;
    }
}
