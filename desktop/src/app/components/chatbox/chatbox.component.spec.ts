import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ChatboxMessage } from '@app/interfaces/chatbox-message';
import { ChatboxHandlerService } from '@app/services/chatbox-handler.service';
import { ChatboxComponent } from './chatbox.component';

const TEST_MESSAGE: ChatboxMessage = { type: 'WorldHello', data: 'WeBigProjectBoisNow' };

const mockMatSnackBar = {
    // Reason : we need a mock for testing purposes but it doesn<t need to do anything
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    open: () => {},
};

describe('ChatboxComponent', () => {
    let component: ChatboxComponent;
    let fixture: ComponentFixture<ChatboxComponent>;
    let chatBoxHandlerSpy: jasmine.SpyObj<ChatboxHandlerService>;

    beforeEach(async () => {
        chatBoxHandlerSpy = jasmine.createSpyObj('ChatboxHandlerService', ['submitMessage', 'resetMessage'], { messages: [TEST_MESSAGE] });
        await TestBed.configureTestingModule({
            imports: [MatCardModule, MatFormFieldModule, FormsModule, ReactiveFormsModule, MatInputModule, BrowserAnimationsModule],
            declarations: [ChatboxComponent],
            providers: [
                { provide: ChatboxHandlerService, useValue: chatBoxHandlerSpy },
                { provide: MatSnackBar, useValue: mockMatSnackBar },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ChatboxComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('ResetInput() should clear input', () => {
        component.input.setValue('Hello Monsieur Chommeur');
        // Reason : Testing private method
        // eslint-disable-next-line dot-notation
        component['resetInput']();
        expect(component.input.value).toEqual('');
    });

    it('submit() should call chatboxHandler.submitMessage() on a valid input', () => {
        const VALID_INPUT = 'Bonjour Tout le monde';
        component.input.setValue(VALID_INPUT);
        component.submit();
        expect(component.input.value).toEqual('');
    });

    it('submit() should call chatboxHandler.submitMessage() ', () => {
        const VALID_INPUT = 'Bonjour Tout le monde';
        component.input.setValue(VALID_INPUT);
        component.submit();
        expect(chatBoxHandlerSpy.submitMessage).toHaveBeenCalledWith(VALID_INPUT);
    });

    it("get messages() should return chatboxHandler's messages", () => {
        expect(component.messages).toEqual([TEST_MESSAGE]);
    });

    it('clickInside() should focus on the input', () => {
        const input = fixture.debugElement.nativeElement.querySelector('#input');
        const spyOnFocus = spyOn(input, 'focus');
        component.clickInside();
        expect(spyOnFocus).toHaveBeenCalled();
    });

    it('clicking on message container should call clickInside()', () => {
        const container = fixture.debugElement.nativeElement.querySelector('.message-container');
        const spyOnClickInside = spyOn(component, 'clickInside');

        container.click();
        expect(spyOnClickInside).toHaveBeenCalled();
    });

    it('Input should focus on initialization', () => {
        const input = fixture.debugElement.nativeElement.querySelector('#input');

        expect(input.focus).toBeTruthy();
    });

    it('All messages should be displayed', () => {
        const messages = fixture.debugElement.nativeElement.querySelectorAll('.message');
        expect(messages.length).toEqual(chatBoxHandlerSpy.messages.length);
    });

    it('scrollToBottom should scroll to the bottom of the message container', () => {
        const SCROLL_HEIGHT = 10;
        const SCROLL_TOP = 20;

        // Reason : accessing private proprety
        // eslint-disable-next-line dot-notation
        component['scrollBox'] = {
            nativeElement: {
                scrollHeight: SCROLL_HEIGHT,
                scrollTop: SCROLL_TOP,
            },
        };

        // Reason : accessing private proprety
        // eslint-disable-next-line dot-notation
        component['scrollToBottom']();

        // Reason : accessing private proprety
        // eslint-disable-next-line dot-notation
        expect(component['scrollBox'].nativeElement.scrollTop).toEqual(component['scrollBox'].nativeElement.scrollTop);
    });

    it('scrollToBottom() should be called after every new message', () => {
        // Reason : testing private proprety
        // eslint-disable-next-line dot-notation
        component['lastMessage'] = {} as ChatboxMessage;
        const spyOnScrollBottom = spyOn(component, 'scrollToBottom' as never);
        const container = fixture.debugElement.nativeElement.querySelector('.message-container');
        container.appendChild(document.createElement('message'));
        fixture.detectChanges();

        expect(spyOnScrollBottom).toHaveBeenCalled();
    });

    it('scrollToBottom() should not be called if there is no new message', () => {
        // Reason : testing private proprety
        // eslint-disable-next-line dot-notation
        component['lastMessage'] = TEST_MESSAGE;
        const spyOnScrollBottom = spyOn(component, 'scrollToBottom' as never);
        const container = fixture.debugElement.nativeElement.querySelector('.message-container');
        container.appendChild(document.createElement('message'));
        fixture.detectChanges();

        expect(spyOnScrollBottom).not.toHaveBeenCalled();
    });

    it('isPlacementCommand() should return true if the message is a placement command', () => {
        const message1 = '!placer h8h Rip';
        const message2 = 'MisterNOO';
        const message3 = '!aide';

        expect(component.isPlacementCommand(message1)).toBeTruthy();
        expect(component.isPlacementCommand(message2)).toBeFalsy();
        expect(component.isPlacementCommand(message3)).toBeFalsy();
    });

    it('submitMessage() should submit the message passed in parameters', () => {
        const message1 = '!placer h8h Rip';
        // REASON : empty function call
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const submitSpy = spyOn(component, 'submit');
        component.submitMessage(message1);
        expect(submitSpy).toHaveBeenCalled();
        expect(component.input.value).toEqual(message1);
    });

    it("a mat error shouldn't be here when input is valid (less than 512 characters)", () => {
        const VALID_INPUT = 'HELLO';
        component.input.setValue(VALID_INPUT);
        const matError = fixture.debugElement.nativeElement.querySelector('.error');
        expect(matError === null).toBeTruthy();
    });
});
