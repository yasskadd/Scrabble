import { TestBed } from '@angular/core/testing';
import { LetterTilesService } from './letter-tiles.service';

describe('LetterTilesService', () => {
    let service: LetterTilesService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(LetterTilesService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
