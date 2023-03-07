import { AfterViewChecked, AfterViewInit, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { ChatboxMessage } from '@common/interfaces/chatbox-message';
import { ChatboxHandlerService } from '@app/services/chat/chatbox-handler.service';
import { GameClientService } from '@app/services/game-client.service';

const PLACEMENT_COMMAND = '^!placer [a-o][0-9]{1,2}(v|h){0,1} [a-zA-Z]{1,7}$';

@Component({
    selector: 'app-chatbox',
    templateUrl: './chatbox.component.html',
    styleUrls: ['./chatbox.component.scss'],
})
export class ChatboxComponent implements AfterViewInit, AfterViewChecked {
    static readonly inputInitialState = '';
    static readonly placementRegex = new RegExp(PLACEMENT_COMMAND);

    @ViewChild('chatbox', { static: false }) chatbox: ElementRef;
    @ViewChild('container') private scrollBox: ElementRef;

    protected input: FormControl;
    private lastMessage: ChatboxMessage;

    constructor(public gameClientService: GameClientService, private chatboxHandler: ChatboxHandlerService) {
        // TODO : Add empty string validator
        this.input = new FormControl(ChatboxComponent.inputInitialState, Validators.required);
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
            //     this.chatboxHandler.resetMessage();
            //     this.chatbox.nativeElement.focus();
        }, 0);
    }

    submit() {
        if (this.input.valid) {
            this.chatboxHandler.submitMessage(this.input.value);
            this.resetInput();
        }
        this.input.markAsTouched();
    }

    isPlacementCommand(message: string): boolean {
        return ChatboxComponent.placementRegex.test(message);
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
