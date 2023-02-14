import { Injectable } from '@angular/core';
import { MINUTES_TO_HOUR, SECONDS_TO_MINUTE } from '@app/constants/time';

@Injectable({
    providedIn: 'root',
})
export class TimeService {
    secondsToMinute(time: number): number {
        return Math.floor(time / SECONDS_TO_MINUTE);
    }

    timerToSecond(timer: number): number {
        const hour = MINUTES_TO_HOUR * SECONDS_TO_MINUTE;
        return timer - Math.floor(timer / hour) * hour - Math.floor((timer - Math.floor(timer / hour) * hour) / SECONDS_TO_MINUTE) * MINUTES_TO_HOUR;
    }

    getTimeStamp(time: number): string {
        const minutes: number = Math.floor(time / SECONDS_TO_MINUTE);
        const seconds: number = time - minutes * SECONDS_TO_MINUTE;

        return minutes.toLocaleString('en-us', { minimumIntegerDigits: 1 }) + ':' + seconds.toLocaleString('en-us', { minimumIntegerDigits: 2 });
    }

    getTimeStampNow(): string {
        const now = new Date();

        return (
            now.getHours().toLocaleString('en-us', { minimumIntegerDigits: 2 }) +
            ':' +
            now.getMinutes().toLocaleString('en-us', { minimumIntegerDigits: 2 }) +
            ':' +
            now.getSeconds().toLocaleString('en-us', { minimumIntegerDigits: 2 })
        );
    }
}
