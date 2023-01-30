import { TestBed } from '@angular/core/testing';
import { HttpHandlerService } from '@app/services/communication/http-handler.service';
import { of } from 'rxjs';
import { DictionaryService } from './dictionary.service';

const DB_DICTIONARY = { _id: '932487fds', title: 'Mon dictionnaire', description: 'Un dictionnaire' };

describe('DictionaryService', () => {
    let service: DictionaryService;
    let httpHandlerSpy: jasmine.SpyObj<HttpHandlerService>;

    beforeEach(() => {
        httpHandlerSpy = jasmine.createSpyObj('HttpHandlerService', [
            'getDictionaries',
            'addDictionary',
            'modifyDictionary',
            'resetDictionaries',
            'deleteDictionary',
            'getDictionary',
        ]);
        httpHandlerSpy.getDictionaries.and.returnValue(of([DB_DICTIONARY]));
        httpHandlerSpy.addDictionary.and.returnValue(of({} as unknown as void));
        httpHandlerSpy.deleteDictionary.and.returnValue(of());
        httpHandlerSpy.resetDictionaries.and.returnValue(of());
        httpHandlerSpy.modifyDictionary.and.returnValue(of());
        httpHandlerSpy.getDictionary.and.returnValue(of());

        TestBed.configureTestingModule({
            providers: [{ provide: HttpHandlerService, useValue: httpHandlerSpy }],
        });
        service = TestBed.inject(DictionaryService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should call httpHandler addDictionary() when calling dictionaryService addDictionary() is called', () => {
        service.addDictionary({ title: 'test dictionary', description: 'a test dictionary', words: ['Expert', 'yo', 'ma'] });
        expect(httpHandlerSpy.addDictionary).toHaveBeenCalled();
        expect(httpHandlerSpy.getDictionaries).toHaveBeenCalled();
    });

    it('should call httpHandler deleteDictionary() when calling dictionaryService deleteDictionary() is called', () => {
        service.deleteDictionary({ title: 'test dictionary', description: 'a test dictionary' });
        expect(httpHandlerSpy.deleteDictionary).toHaveBeenCalled();
    });

    it('should call httpHandler modifyDictionary() when calling dictionaryService modifyDictionary() is called', () => {
        service.modifyDictionary({ title: 'test dictionary', newTitle: 'test test', newDescription: 'a test dictionary' });
        expect(httpHandlerSpy.modifyDictionary).toHaveBeenCalled();
    });

    it('should call httpHandler resetDictionaries() when calling dictionaryService resetDictionaries() is called', () => {
        service.resetDictionaries();
        expect(httpHandlerSpy.resetDictionaries).toHaveBeenCalled();
    });

    it('should call httpHandler getDictionary() when calling dictionaryService getDictionary() is called', () => {
        service.getDictionary('TITRE');
        expect(httpHandlerSpy.getDictionary).toHaveBeenCalled();
    });

    it('should call httpHandler getDictionaries() when calling dictionaryService getDictionaries() is called', () => {
        service.getDictionaries();
        expect(httpHandlerSpy.getDictionaries).toHaveBeenCalled();
    });
});
