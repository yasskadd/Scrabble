import { Injectable } from '@angular/core';
import { Dictionary } from '@app/interfaces/dictionary';
import { HttpHandlerService } from './communication/http-handler.service';
import { GameConfigurationService } from './game-configuration.service';
import { MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH } from '@common/constants/dictionary';
import { HTTP_STATUS } from '@common/models/http-status';
// import { HttpResponse } from '@angular/common/http';
import { Subject } from 'rxjs';
import { DictionaryEvents } from '@common/models/dictionary-events';

@Injectable({
    providedIn: 'root',
})
export class DictionaryVerificationService {
    constructor(private readonly httpHandler: HttpHandlerService, public gameConfiguration: GameConfigurationService) {}

    globalVerification(dictionary: Dictionary): Subject<string> {
        const subject: Subject<string> = new Subject<string>();

        this.httpHandler.dictionaryIsInDb(dictionary.title).subscribe((res: any) => {
            if (res.status === HTTP_STATUS.FOUND) {
                subject.next(DictionaryEvents.FOUND);
            } else if (this.fieldEmptyVerification(dictionary)) {
                subject.next(this.fieldEmptyVerification(dictionary));
            } else if (this.fieldLimitVerification(dictionary)) {
                subject.next(this.fieldLimitVerification(dictionary));
            } else if (!this.isDictionary(dictionary)) {
                subject.next(DictionaryEvents.NOT_DICTIONARY);
            } else {
                subject.next('');
            }
        });

        return subject;
    }

    private isDictionary(dictionary: Dictionary): boolean {
        if ('title' && 'description' && 'words' in dictionary) {
            return typeof dictionary.title === 'string' && typeof dictionary.description === 'string' && this.wordsListIsValid(dictionary.words);
        }

        return false;
    }

    private fieldEmptyVerification(dictionary: Dictionary): string {
        if (!dictionary.title) {
            return DictionaryEvents.NO_TITLE;
        }
        if (!dictionary.description) {
            return DictionaryEvents.NO_DESCRIPTION;
        }
        if (!dictionary.words) {
            return DictionaryEvents.NO_WORDS;
        }
        return '';
    }

    private fieldLimitVerification(dictionary: Dictionary): string {
        if (this.fieldCharacterLimit(dictionary.title.split(''), MAX_TITLE_LENGTH)) {
            return DictionaryEvents.TITLE_TOO_LONG;
        }
        if (this.fieldCharacterLimit(dictionary.description.split(''), MAX_DESCRIPTION_LENGTH)) {
            return DictionaryEvents.DESCRIPTION_TOO_LONG;
        }

        return '';
    }

    private fieldCharacterLimit(array: unknown[], maxLimit: number): boolean {
        return array.length > maxLimit;
    }

    private wordsListIsValid(words: unknown): boolean {
        if (!Array.isArray(words)) return false;
        return !words.some((word) => !this.wordIsValid(word));
    }

    private wordIsValid(word: unknown): boolean {
        if (typeof word !== 'string') return false;
        return /^[a-z][a-z]+$/.test(word as string);
    }
}
