import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenericChatComponent } from './generic-chat.component';

describe('GenericChatComponent', () => {
    let component: GenericChatComponent;
    let fixture: ComponentFixture<GenericChatComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [GenericChatComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(GenericChatComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
