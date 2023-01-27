import { Injectable } from '@angular/core';

const SECOND = 60;
const MINUTE = 60;
@Injectable({
    providedIn: 'root',
})
export class TimerService {
    timerToMinute(time: number): number {
        return Math.floor(time / SECOND);
    }

    timerToSecond(timer: number): number {
        const hour = MINUTE * SECOND;
        return timer - Math.floor(timer / hour) * hour - Math.floor((timer - Math.floor(timer / hour) * hour) / SECOND) * MINUTE;
    }

    secondToMinute(time: number): string {
        const minute = Math.floor(time / SECOND);
        const second = time - minute * SECOND;

        if (second === 0) {
            return minute.toString() + ':00 minutes';
        }
        return minute.toString() + ':30 minutes';
    }
}
