/* eslint-disable dot-notation -- testing private methods or attributes */
import { HttpClientModule } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Dictionary } from '@app/interfaces/dictionary';
import { of } from 'rxjs';
import { HttpHandlerService } from './communication/http-handler.service';
import { DictionaryVerificationService } from './dictionary-verification.service';

const HTTP_STATUS_FOUND = 200;

describe('DictionaryVerificationService', () => {
    let service: DictionaryVerificationService;
    let httpHandlerSpy: jasmine.SpyObj<HttpHandlerService>;

    beforeEach(() => {
        httpHandlerSpy = jasmine.createSpyObj('HttpHandlerService', ['getDictionaries', 'dictionaryIsInDb']);
        httpHandlerSpy.getDictionaries.and.returnValue(
            of([{ _id: '932487fds', title: 'Mon dictionnaire', description: 'Un dictionnaire', words: ['string'] }]),
        );
        httpHandlerSpy.dictionaryIsInDb.and.returnValue(of({}));
        TestBed.configureTestingModule({
            imports: [HttpClientModule],
            providers: [{ provide: HttpHandlerService, useValue: httpHandlerSpy }],
        });
        service = TestBed.inject(DictionaryVerificationService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('globalVerification() should not return Passed if the file is not a dictionary', async () => {
        // Reason : is dictionary could be any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isDictionarySpy = spyOn<any>(service, 'isDictionary');
        isDictionarySpy.and.callFake(() => false);
        expect(await service.globalVerification({})).toEqual(
            "Le fichier téléversé n'est pas un dictionnaire. Les champs title, description ou words sont manquant.",
        );
    });

    it('globalVerification() should not return Passed if the file has empty field', async () => {
        // Reason : is dictionary could be any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isDictionarySpy = spyOn<any>(service, 'isDictionary');
        // Reason : is dictionary could be any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fieldEmptyVerificationSpy = spyOn<any>(service, 'fieldEmptyVerification');

        isDictionarySpy.and.callFake(() => true);
        fieldEmptyVerificationSpy.and.callFake(() => 'Did not pass');

        expect(await service.globalVerification({})).toEqual('Did not pass');
    });

    it('globalVerification() should not return Passed if the file title and description does not respect character limit', async () => {
        // Reason : is dictionary could be any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isDictionarySpy = spyOn<any>(service, 'isDictionary');
        // Reason : is dictionary could be any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fieldEmptyVerificationSpy = spyOn<any>(service, 'fieldEmptyVerification');
        // Reason : is dictionary could be any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fieldLimitVerificationSpy = spyOn<any>(service, 'fieldLimitVerification');

        isDictionarySpy.and.callFake(() => true);
        fieldEmptyVerificationSpy.and.callFake(() => 'Passed');
        fieldLimitVerificationSpy.and.callFake(() => 'Did not pass');

        expect(await service.globalVerification({})).toEqual('Did not pass');
    });

    it('globalVerification() should not return Passed if the file already exist in database', async () => {
        // Reason : is dictionary could be any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isDictionarySpy = spyOn<any>(service, 'isDictionary');
        // Reason : is dictionary could be any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fieldEmptyVerificationSpy = spyOn<any>(service, 'fieldEmptyVerification');
        // Reason : is dictionary could be any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fieldLimitVerificationSpy = spyOn<any>(service, 'fieldLimitVerification');
        // Reason : is dictionary could be any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const alreadyExistSpy = spyOn<any>(service, 'alreadyExist');

        isDictionarySpy.and.callFake(() => true);
        fieldEmptyVerificationSpy.and.callFake(() => 'Passed');
        fieldLimitVerificationSpy.and.callFake(() => 'Passed');
        alreadyExistSpy.and.callFake(() => 'Did not pass');

        expect(await service.globalVerification({})).toEqual('Did not pass');
    });

    it('globalVerification() should return Passed if the file passed all tests', async () => {
        // Reason : is dictionary could be any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isDictionarySpy = spyOn<any>(service, 'isDictionary');
        // Reason : is dictionary could be any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fieldEmptyVerificationSpy = spyOn<any>(service, 'fieldEmptyVerification');
        // Reason : is dictionary could be any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fieldLimitVerificationSpy = spyOn<any>(service, 'fieldLimitVerification');
        // Reason : is dictionary could be any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const alreadyExistSpy = spyOn<any>(service, 'alreadyExist');

        isDictionarySpy.and.callFake(() => true);
        fieldEmptyVerificationSpy.and.callFake(() => 'Passed');
        fieldLimitVerificationSpy.and.callFake(() => 'Passed');
        alreadyExistSpy.and.callFake(() => 'Passed');

        expect(await service.globalVerification({})).toEqual('Passed');
    });

    it('isDictionary() should return false if the dictionary does not have a title, description and words fields', () => {
        const dictionary = { title: 'Mon dictionnaire' } as Dictionary;
        expect(service['isDictionary'](dictionary)).toBeFalsy();
    });

    it('isDictionary() should return false if the dictionary title is not a string', () => {
        const dictionary = { title: 0, description: 'Une description', words: ['string'] };
        expect(service['isDictionary'](dictionary)).toBeFalsy();
    });

    it('isDictionary() should return false if the dictionary description is not a string', () => {
        const dictionary = { title: 'Mon dictionnaire', description: 0, words: ['string'] };
        expect(service['isDictionary'](dictionary)).toBeFalsy();
    });

    it('isDictionary() should return false if the dictionary words list is not valid', () => {
        const dictionary = { title: 'Mon dictionnaire', description: 'Une description', words: [0] };
        expect(service['isDictionary'](dictionary)).toBeFalsy();
    });

    it('isDictionary() should return true if the dictionary is valid', () => {
        const dictionary = { title: 'Mon dictionnaire', description: 'Une description', words: ['string'] };
        expect(service['isDictionary'](dictionary)).toBeTruthy();
    });

    it('fieldEmptyVerification() should not return Passed if the dictionary title is empty', () => {
        const dictionary = { title: ' ' } as Dictionary;
        expect(service['fieldEmptyVerification'](dictionary)).toEqual("Le dictionnaire n'a pas de titre");
    });

    it('fieldEmptyVerification() should not return Passed if the dictionary description is empty', () => {
        const dictionary = { title: 'Mon dictionnaire', description: ' ' } as Dictionary;
        expect(service['fieldEmptyVerification'](dictionary)).toEqual("Le dictionnaire n'a pas de description");
    });

    it('fieldEmptyVerification() should not return Passed if the dictionary words list is empty', () => {
        const dictionary = { title: 'Mon dictionnaire', description: 'Une description', words: [] } as Dictionary;
        expect(service['fieldEmptyVerification'](dictionary)).toEqual("Le dictionnaire n'a pas une liste de mots");
    });

    it('fieldEmptyVerification() should return Passed if all field of the dictionary is not empty', () => {
        const dictionary = { title: 'Mon dictionnaire', description: 'Une description', words: ['string'] } as Dictionary;
        expect(service['fieldEmptyVerification'](dictionary)).toEqual('Passed');
    });

    it('fieldLimitVerification() should not return Passed if the dictionary title has more than 30 characters', () => {
        const dictionary = { title: 'Mon nouveau très long dictionnaire' } as Dictionary;
        expect(service['fieldLimitVerification'](dictionary)).toEqual('Le titre du dictionnaire est trop long!');
    });

    it('fieldLimitVerification() should not return Passed if the dictionary description has more than 125 characters', () => {
        const dictionary = {
            title: 'Mon dictionnaire',
            description:
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean quis fermentum quam. Ut venenatis enim eu nulla molestie amet.',
        } as Dictionary;
        expect(service['fieldLimitVerification'](dictionary)).toEqual('La description du dictionnaire est trop long!');
    });

    it('fieldLimitVerification() should return Passed if the dictionary title and description respect character limit', () => {
        const dictionary = { title: 'Mon dictionnaire', description: 'Une description' } as Dictionary;
        expect(service['fieldLimitVerification'](dictionary)).toEqual('Passed');
    });

    it('fieldIsEmpty() should return true if the field is a string and is empty', () => {
        const emptyStringField = ' ';
        expect(service['fieldIsEmpty'](emptyStringField)).toBeTruthy();
    });

    it('fieldIsEmpty() should return false if the field is a string and is not empty', () => {
        const nonEmptyStringField = 'Mon dictionnaire';
        expect(service['fieldIsEmpty'](nonEmptyStringField)).toBeFalsy();
    });

    it('fieldIsEmpty() should return true if the field is an array and is empty', () => {
        const emptyArrayField: unknown[] = [];
        expect(service['fieldIsEmpty'](emptyArrayField)).toBeTruthy();
    });

    it('fieldIsEmpty() should return false if the field is an array and is not empty', () => {
        const nonEmptyArrayField = ['string'];
        expect(service['fieldIsEmpty'](nonEmptyArrayField)).toBeFalsy();
    });

    it('fieldCharacterLimit() should return true if the param length is greater than the max limit passed as param', () => {
        const dictionary = 'Mon nouveau dictionnaire';
        const maxLimit = 10;
        expect(service['fieldCharacterLimit'](dictionary.split(''), maxLimit)).toBeTruthy();
    });

    it('fieldCharacterLimit() should return false if the param length is not greater than the max limit passed as param', () => {
        const dictionary = 'Mon nouveau dictionnaire';
        const maxLimit = 30;
        expect(service['fieldCharacterLimit'](dictionary.split(''), maxLimit)).toBeFalsy();
    });

    it('alreadyExist() should return Passed if the uploaded file already exist in the database', async () => {
        const dictionary = 'Mon nouveau dictionnaire';
        expect(await service['alreadyExist'](dictionary)).toEqual('Passed');
    });

    it('returnStatus() should return Le dictionnaire existe déjà dans la base de données if HTTP status is 200', async () => {
        expect(service['returnStatus'](HTTP_STATUS_FOUND)).toEqual('Le dictionnaire existe déjà dans la base de données');
    });

    it('wordsListIsValid() should return true if the words passed as param is valid', () => {
        const validWords = ['word', 'string', 'test'];
        expect(service['wordsListIsValid'](validWords)).toBeTruthy();
    });

    it('wordsListIsValid() should return false if the words passed as param has word that is not valid', () => {
        const nonValidWords = ['l', 1, 'Test', 'test1'];
        expect(service['wordsListIsValid'](nonValidWords)).toBeFalsy();
    });

    it('wordsListIsValid() should return false if the words passed as param is not an array', () => {
        const nonArrayWords = ' ';
        expect(service['wordsListIsValid'](nonArrayWords)).toBeFalsy();
    });

    it('wordIsValid() should return false if the word passed as param is not a string', () => {
        const nonStringWord = 1;
        expect(service['wordIsValid'](nonStringWord)).toBeFalsy();
    });

    it('wordIsValid() should return false if the word passed as param has hyphen', () => {
        const hyphenWord = 'celui-ci';
        expect(service['wordIsValid'](hyphenWord)).toBeFalsy();
    });

    it('wordIsValid() should return false if the word passed as param has space', () => {
        const spaceWord = 'celui ci';
        expect(service['wordIsValid'](spaceWord)).toBeFalsy();
    });

    it('wordIsValid() should return false if the word passed as param has capital letter', () => {
        const capitalLetterWord = 'Celui';
        expect(service['wordIsValid'](capitalLetterWord)).toBeFalsy();
    });

    it('wordIsValid() should return false if the word passed as param has only one letter', () => {
        const oneLetterWord = 'c';
        expect(service['wordIsValid'](oneLetterWord)).toBeFalsy();
    });
});
