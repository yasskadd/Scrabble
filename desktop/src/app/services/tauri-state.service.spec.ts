import { TestBed } from '@angular/core/testing';

import { TauriStateService } from './tauri-state.service';

describe('TauriStateService', () => {
    let service: TauriStateService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(TauriStateService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
