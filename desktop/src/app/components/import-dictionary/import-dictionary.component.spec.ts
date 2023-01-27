import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpHandlerService } from '@app/services/communication/http-handler.service';
import { DictionaryVerificationService } from '@app/services/dictionary-verification.service';
import { of } from 'rxjs';
import { ImportDictionaryComponent } from './import-dictionary.component';

const TIMEOUT = 5000;
const DB_DICTIONARY = { _id: '932487fds', title: 'Mon dictionnaire', description: 'Un dictionnaire' };

describe('ImportDictionaryComponent', () => {
    let component: ImportDictionaryComponent;
    let fixture: ComponentFixture<ImportDictionaryComponent>;

    let httpHandlerSpy: jasmine.SpyObj<HttpHandlerService>;
    let dictionaryVerifificationServiceSpy: jasmine.SpyObj<DictionaryVerificationService>;

    beforeEach(async () => {
        httpHandlerSpy = jasmine.createSpyObj('HttpHandlerService', ['getDictionaries', 'addDictionary']);
        httpHandlerSpy.getDictionaries.and.returnValue(of([DB_DICTIONARY]));
        httpHandlerSpy.addDictionary.and.returnValue(of({} as unknown as void));

        dictionaryVerifificationServiceSpy = jasmine.createSpyObj('DictionaryVerificationService', ['globalVerification']);

        await TestBed.configureTestingModule({
            declarations: [ImportDictionaryComponent],
            providers: [
                { provide: HttpHandlerService, useValue: httpHandlerSpy },
                { provide: DictionaryVerificationService, useValue: dictionaryVerifificationServiceSpy },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ImportDictionaryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('clicking on import button should call uploadDictionary()', fakeAsync(() => {
        const blob = new Blob([JSON.stringify(DB_DICTIONARY)], { type: 'application/json' });
        const dT = new DataTransfer();
        dT.items.add(new File([blob], 'test.json'));
        component.file.nativeElement.files = dT.files;
        const uploadDictionarySpy = spyOn(component, 'uploadDictionary');
        const button = fixture.debugElement.nativeElement.querySelector('#import');
        button.click();
        tick();
        fixture.detectChanges();
        expect(uploadDictionarySpy).toHaveBeenCalled();
    }));

    it('uploadDictionary() should call fileOnLoad if there is a selected file to upload', async () => {
        const messageSpy = spyOn(component, 'fileOnLoad');
        const blob = new Blob([JSON.stringify(DB_DICTIONARY)], { type: 'application/json' });
        const dT = new DataTransfer();
        dT.items.add(new File([blob], 'test.json'));
        component.file.nativeElement.files = dT.files;

        dictionaryVerifificationServiceSpy.globalVerification.and.callFake(async () => 'Did not passed');
        await component.uploadDictionary();
        expect(messageSpy).toHaveBeenCalled();
    });

    it('uploadDictionary() should not call fileOnLoad if there is a not a selected file to upload', async () => {
        const messageSpy = spyOn(component, 'fileOnLoad');

        dictionaryVerifificationServiceSpy.globalVerification.and.callFake(async () => 'Did not passed');
        await component.uploadDictionary();
        expect(messageSpy).not.toHaveBeenCalled();
    });

    // Reason : test name too long
    // eslint-disable-next-line max-len
    it('fileOnLoad() should call addDictionary of HttpHandlerService if file selected passed globalVerification of DictionaryVerificationService', fakeAsync(() => {
        const messageSpy = spyOn(component, 'updateDictionaryMessage');
        const blob = new Blob([JSON.stringify(DB_DICTIONARY)], { type: 'application/json' });
        const dT = new DataTransfer();
        dT.items.add(new File([blob], 'test.json'));
        component.file.nativeElement.files = dT.files;
        dictionaryVerifificationServiceSpy.globalVerification.and.callFake(async () => 'Passed');
        component.fileOnLoad({});
        tick(TIMEOUT);
        expect(messageSpy).toHaveBeenCalledWith('Ajout avec succès du nouveau dictionnaire', 'black');
        expect(httpHandlerSpy.addDictionary).toHaveBeenCalled();
    }));

    // Reason : test name too long
    // eslint-disable-next-line max-len
    it('fileOnLoad() should call updateImportMessage with error message if file selected did not pass globalVerification of DictionaryVerificationService', fakeAsync(() => {
        const messageSpy = spyOn(component, 'updateDictionaryMessage');
        const blob = new Blob([JSON.stringify(DB_DICTIONARY)], { type: 'application/json' });
        const dT = new DataTransfer();
        dT.items.add(new File([blob], 'test.json'));
        component.file.nativeElement.files = dT.files;
        dictionaryVerifificationServiceSpy.globalVerification.and.callFake(async () => 'Did not passed');
        component.fileOnLoad({});
        tick(TIMEOUT);
        expect(messageSpy).toHaveBeenCalledWith('Did not passed', 'red');
    }));

    it('readFile() should return the content of the file', async () => {
        const blob = new Blob([JSON.stringify(DB_DICTIONARY)], { type: 'application/json' });
        // Reason : testing private method
        // eslint-disable-next-line dot-notation
        const res = await component['readFile'](new File([blob], 'test.json'), new FileReader());
        expect(res).toEqual(DB_DICTIONARY);
    });

    it('readFile() should return error message if file cannot be opened ', () => {
        const blob = new Blob([JSON.stringify(DB_DICTIONARY)], { type: 'application/json' });
        const fileReader = new FileReader();
        // Reason : testing private method
        // eslint-disable-next-line dot-notation
        const res = component['readFile'](new File([blob], 'test.json'), fileReader).then(() => {
            fileReader.dispatchEvent(new ErrorEvent('error'));
        });
        expect(res).not.toEqual(DB_DICTIONARY as unknown as Promise<Record<string, unknown>>);
    });

    describe('detectImportFile  tests', () => {
        it('detectImportFile() should set textContent of fileError to nothing', () => {
            const message = '';
            component.detectImportFile();
            expect(component.fileError.nativeElement.textContent).toEqual(message);
        });

        it('detectImportFile() should set selectedFile to null if there is a file that is being selected', () => {
            const blob = new Blob([JSON.stringify(DB_DICTIONARY)], { type: 'application/json' });
            const dT = new DataTransfer();
            dT.items.add(new File([blob], 'test.json'));
            component.file.nativeElement.files = dT.files;
            component.detectImportFile();
            expect(component.selectedFile).toEqual(null);
        });

        it('selecting a file should call detectImportFile()', fakeAsync(() => {
            const detectImportFileSpy = spyOn(component, 'detectImportFile');
            const input = fixture.debugElement.nativeElement.querySelector('#selectFiles');
            input.dispatchEvent(new Event('change'));
            tick();
            fixture.detectChanges();
            expect(detectImportFileSpy).toHaveBeenCalled();
        }));
        it('updateImportMessage() should set textContent of fileError p with message and text color passed as param', () => {
            const message = 'Message';
            const color = 'red';
            component.updateDictionaryMessage(message, color);
            expect(component.fileError.nativeElement.textContent).toEqual(message);
            expect(component.fileError.nativeElement.style.color).toEqual(color);
        });
    });

    it('updateImportMessage() should set textContent of fileError p with message and text color passed as param', () => {
        const message = 'Message';
        const color = 'red';
        component.updateDictionaryMessage(message, color);
        expect(component.fileError.nativeElement.textContent).toEqual(message);
        expect(component.fileError.nativeElement.style.color).toEqual(color);
    });
});
