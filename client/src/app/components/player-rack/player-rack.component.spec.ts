import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlayerRackComponent } from './player-rack.component';

describe('PlayerRackComponent', () => {
    let component: PlayerRackComponent;
    let fixture: ComponentFixture<PlayerRackComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PlayerRackComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PlayerRackComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
