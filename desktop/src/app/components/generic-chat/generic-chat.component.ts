import { AfterViewChecked, AfterViewInit, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ChatboxHandlerService } from '@app/services/chat/chatbox-handler.service';
import { ChatboxMessage } from '@common/interfaces/chatbox-message';

@Component({
    selector: 'app-generic-chat',
    templateUrl: './generic-chat.component.html',
    styleUrls: ['./generic-chat.component.scss'],
})
export class GenericChatComponent implements AfterViewInit, AfterViewChecked {
    static readonly inputInitialState = '';
    loggedIn: boolean = false;

    @ViewChild('chatbox', { static: false }) chatbox: ElementRef;
    @ViewChild('container') private scrollBox: ElementRef;

    input = new FormControl(GenericChatComponent.inputInitialState);
    private lastMessage: ChatboxMessage;

    constructor(private chatboxHandler: ChatboxHandlerService) {}

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
        this.chatboxHandler.submitMessage(this.input.value);
        this.resetInput();
    }

    submitMessage(message: string) {
        this.input.setValue(message);
        this.submit();
    }

    ngAfterViewChecked(): void {
        const lastMessage = this.chatboxHandler.messages[this.chatboxHandler.messages.length - 1];
        if (this.lastMessage !== lastMessage) {
            this.lastMessage = lastMessage;
            this.scrollToBottom();
        }
    }

    private resetInput() {
        this.input.setValue('');
    }

    private scrollToBottom(): void {
        this.scrollBox.nativeElement.scrollTop = this.scrollBox.nativeElement.scrollHeight;
    }
}
