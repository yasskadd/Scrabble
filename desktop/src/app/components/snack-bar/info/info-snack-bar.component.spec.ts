import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoSnackBarComponent } from './info-snack-bar.component';

describe('InfoComponent', () => {
    let component: InfoSnackBarComponent;
    let fixture: ComponentFixture<InfoSnackBarComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [InfoSnackBarComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(InfoSnackBarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
