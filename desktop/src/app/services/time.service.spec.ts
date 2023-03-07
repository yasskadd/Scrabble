import { TestBed } from '@angular/core/testing';
import { TimeService } from './time.service';

describe('TimeService', () => {
    let service: TimeService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(TimeService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('timerToMinute() should return number of minute in the timer', () => {
        const twoMinute = 120;
        const expectedValue = 2;
        expect(service.secondsToMinute(twoMinute)).toEqual(expectedValue);
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
        expect(service.getTimeStamp(TIMER1)).toEqual(expectedValue1);
        expect(service.getTimeStamp(TIMER2)).toEqual(expectedValue2);
    });
});
