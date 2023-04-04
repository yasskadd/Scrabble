import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class TauriStateService {
    // eslint-disable-next-line no-underscore-dangle
    useTauri: boolean = !!window.__TAURI_IPC__;
}
