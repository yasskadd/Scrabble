import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ThemeService {
    private _darkTheme = new BehaviorSubject<boolean>(false);
    isDarkTheme = this._darkTheme.asObservable();

    constructor() {}

    setDarkTheme(isDarkTheme: boolean): void {
        this._darkTheme.next(isDarkTheme);
    }
}
