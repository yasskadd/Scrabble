import { AfterViewChecked, AfterViewInit, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { ChatboxHandlerService } from '@app/services/chatbox-handler.service';

const MAX_LENGTH = 512;
@Component({
    selector: 'app-chatbox',
    templateUrl: './chatbox.component.html',
    styleUrls: ['./chatbox.component.scss'],
})
export class ChatboxComponent implements AfterViewInit, AfterViewChecked {
    static readonly inputInitialState = '';
    @ViewChild('chatbox', { static: false }) chatbox: ElementRef;
    @ViewChild('container') private scrollBox: ElementRef;

    input = new FormControl(ChatboxComponent.inputInitialState, [Validators.maxLength(MAX_LENGTH)]);
    constructor(public chatboxHandler: ChatboxHandlerService) {}

    @HostListener('click')
    clickInside() {
        this.chatbox.nativeElement.focus();
    }

    ngAfterViewInit() {
        this.chatbox.nativeElement.focus();
    }

    get messages() {
        return this.chatboxHandler.messages;
    }

    submit() {
        if (this.input.valid) {
            this.chatboxHandler.submitMessage(this.input.value);
            this.resetInput();
        }
    }

    ngAfterViewChecked(): void {
        this.scrollToBottom();
    }

    private resetInput() {
        this.input.setValue('');
    }

    private scrollToBottom(): void {
        this.scrollBox.nativeElement.scrollTop = this.scrollBox.nativeElement.scrollHeight;
    }
}
