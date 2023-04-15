import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogBoxCreateChatComponent } from './dialog-box-create-chat.component';

describe('DialogBoxCreateChatComponent', () => {
  let component: DialogBoxCreateChatComponent;
  let fixture: ComponentFixture<DialogBoxCreateChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogBoxCreateChatComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogBoxCreateChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
