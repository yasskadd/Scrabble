import { TestBed } from '@angular/core/testing';
import { TimerService } from './timer.service';

describe('TimerService', () => {
    let service: TimerService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(TimerService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('timerToMinute() should return number of minute in the timer', () => {
        const twoMinute = 120;
        const expectedValue = 2;
        expect(service.timerToMinute(twoMinute)).toEqual(expectedValue);
    });

    it('timerToSecond() should return number of second in the timer', () => {
        const fiftyNineSecond = 179;
        const expectedValue = 59;
        expect(service.timerToSecond(fiftyNineSecond)).toEqual(expectedValue);
    });

    it('secondToMinute() should convert second to minute display', () => {
        const TIMER1 = 180;
        const TIMER2 = 210;
        const expectedValue1 = '3:00 minutes';
        const expectedValue2 = '3:30 minutes';
        expect(service.secondToMinute(TIMER1)).toEqual(expectedValue1);
        expect(service.secondToMinute(TIMER2)).toEqual(expectedValue2);
    });
});
