import { AfterViewChecked, AfterViewInit, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ChatboxHandlerService } from '@app/services/chat/chatbox-handler.service';
import { UserService } from '@app/services/user.service';
import { ChatboxMessage } from '@common/interfaces/chatbox-message';

@Component({
    selector: 'app-generic-chat',
    templateUrl: './generic-chat.component.html',
    styleUrls: ['./generic-chat.component.scss'],
})
export class GenericChatComponent implements AfterViewInit, AfterViewChecked {
    @ViewChild('chatbox', { static: false }) chatbox: ElementRef;
    @ViewChild('container') private scrollBox: ElementRef;
    activeTab: string;
    chatSession: string | undefined;

    inputForm: FormControl;
    private lastMessage: ChatboxMessage;

    constructor(private chatboxHandler: ChatboxHandlerService, protected userService: UserService) {
        this.inputForm = new FormControl('');
        this.activeTab = 'joinedChats';
    }

    get messages() {
        return this.chatboxHandler.messages;
    }

    @HostListener('click')
    clickInside() {
        this.chatbox.nativeElement.focus();
    }

    ngAfterViewInit() {
        setTimeout(() => {
            // this.chatboxHandler.resetMessage();
            this.chatbox.nativeElement.focus();
        }, 0);
    }

    submit() {
        this.chatboxHandler.submitMessage(this.inputForm.value);
        this.resetInput();
    }

    submitMessage(message: string) {
        this.inputForm.setValue(message);
        this.submit();
    }

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
        this.chatSession = chatRoomName;
    }

    private resetInput() {
        this.inputForm.setValue('');
    }

    private scrollToBottom(): void {
        this.scrollBox.nativeElement.scrollTop = this.scrollBox.nativeElement.scrollHeight;
    }
}
