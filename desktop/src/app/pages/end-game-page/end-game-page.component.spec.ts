import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EndGamePageComponent } from './end-game-page.component';

describe('EndGamePageComponent', () => {
  let component: EndGamePageComponent;
  let fixture: ComponentFixture<EndGamePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EndGamePageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EndGamePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
