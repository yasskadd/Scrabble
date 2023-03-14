import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogBoxAvatarSelectorComponent } from './dialog-box-avatar-selector.component';

describe('DialogBoxAvatarSelectorComponent', () => {
    let component: DialogBoxAvatarSelectorComponent;
    let fixture: ComponentFixture<DialogBoxAvatarSelectorComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DialogBoxAvatarSelectorComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(DialogBoxAvatarSelectorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
