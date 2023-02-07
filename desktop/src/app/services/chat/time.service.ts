import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class TimeService {
    // constructor() {}

    getTimeStamp(): string {
        // TODO : À faire
        const now = Date.now();

        return '';
    }
}
