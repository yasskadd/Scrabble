import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateAccountComponent } from './user-creation-page.component';

describe('CreateAccountComponent', () => {
    let component: CreateAccountComponent;
    let fixture: ComponentFixture<CreateAccountComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CreateAccountComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(CreateAccountComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
