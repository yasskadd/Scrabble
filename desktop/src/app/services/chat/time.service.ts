import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class TimeService {
    getTimeStamp(): string {
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
