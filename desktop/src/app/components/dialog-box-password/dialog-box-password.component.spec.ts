import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogBoxPasswordComponent } from './dialog-box-password.component';

describe('DialogBoxPasswordComponent', () => {
    let component: DialogBoxPasswordComponent;
    let fixture: ComponentFixture<DialogBoxPasswordComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DialogBoxPasswordComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(DialogBoxPasswordComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
