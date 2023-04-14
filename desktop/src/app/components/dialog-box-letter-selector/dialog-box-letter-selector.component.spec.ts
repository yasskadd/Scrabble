import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogBoxLetterSelectorComponent } from './dialog-box-letter-selector.component';

describe('DialogBoxLetterSelectorComponent', () => {
    let component: DialogBoxLetterSelectorComponent;
    let fixture: ComponentFixture<DialogBoxLetterSelectorComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DialogBoxLetterSelectorComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(DialogBoxLetterSelectorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
