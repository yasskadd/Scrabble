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
    verificationStatus: Subject<DictionaryEvents>;

    constructor(private readonly httpHandler: HttpHandlerService, public gameConfiguration: GameConfigurationService) {
        this.verificationStatus = new Subject<DictionaryEvents>();
    }

    globalVerification(dictionary: Dictionary): void {
        if (dictionary.title.split(' ').length > 1 && dictionary.title !== 'Mon Dictionnaire') {
            this.verificationStatus.next(DictionaryEvents.TITLE_INVALID);
        } else {
            this.httpHandler.dictionaryIsInDb(dictionary.title).then((res: any) => {
                if (res.status === HTTP_STATUS.FOUND) {
                    this.verificationStatus.next(DictionaryEvents.FOUND);
                }

                if (this.fieldEmptyVerification(dictionary) && this.isDictionaryVerification(dictionary) && this.fieldLimitVerification(dictionary)) {
                    this.verificationStatus.next(DictionaryEvents.VALID);
                }
            });
        }
    }

    private isDictionaryVerification(dictionary: Dictionary): boolean {
        if (typeof dictionary.title === 'string' && typeof dictionary.description === 'string' && this.wordsListIsValid(dictionary.words)) {
            return true;
        }
        this.verificationStatus.next(DictionaryEvents.NOT_DICTIONARY);
        return false;
    }

    private fieldEmptyVerification(dictionary: Dictionary): boolean {
        if (!dictionary.title) {
            this.verificationStatus.next(DictionaryEvents.NO_TITLE);
            return false;
        }
        if (!dictionary.description) {
            this.verificationStatus.next(DictionaryEvents.NO_DESCRIPTION);
            return false;
        }
        if (!dictionary.words) {
            this.verificationStatus.next(DictionaryEvents.NO_WORDS);
            return false;
        }

        return true;
    }

    private fieldLimitVerification(dictionary: Dictionary): boolean {
        if (this.fieldCharacterLimit(dictionary.title.split(''), MAX_TITLE_LENGTH)) {
            this.verificationStatus.next(DictionaryEvents.TITLE_TOO_LONG);
            return false;
        }
        if (this.fieldCharacterLimit(dictionary.description.split(''), MAX_DESCRIPTION_LENGTH)) {
            this.verificationStatus.next(DictionaryEvents.DESCRIPTION_TOO_LONG);
            return false;
        }

        return true;
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
