import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogBoxReconnectionComponent } from './dialog-box-reconnection.component';

describe('DialogBoxReconnectionComponent', () => {
    let component: DialogBoxReconnectionComponent;
    let fixture: ComponentFixture<DialogBoxReconnectionComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DialogBoxReconnectionComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(DialogBoxReconnectionComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
