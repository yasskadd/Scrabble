import { Injectable } from '@angular/core';
import { Dictionary } from '@app/interfaces/dictionary';
import { DictionaryInfo } from '@app/interfaces/dictionary-info';
import { ModifiedDictionaryInfo } from '@common/interfaces/modified-dictionary-info';
import { DictionaryEvents } from '@common/models/dictionary-events';
import { DictionaryVerificationService } from '@services/dictionary-verification.service';
import { SnackBarService } from '@services/snack-bar.service';
import { Observable, Subject } from 'rxjs';
import { HttpHandlerService } from './communication/http-handler.service';
import { LanguageService } from './language.service';

@Injectable({
    providedIn: 'root',
})
export class DictionaryService {
    dictionary: Dictionary;
    dictionariesInfos: DictionaryInfo[];

    constructor(
        private snackBarService: SnackBarService,
        private readonly httpHandler: HttpHandlerService,
        private dictionaryVerificationService: DictionaryVerificationService,
        private languageService: LanguageService,
    ) {}

    addDictionary(dictionary: Dictionary): Subject<string> {
        const subject: Subject<string> = new Subject<string>();
        this.dictionaryVerificationService.verificationStatus.subscribe((error: string) => {
            if (error) {
                subject.next(error);
            } else {
                subject.next('');
                this.httpHandler.addDictionary(dictionary).then(() => {
                    this.languageService.getWord(DictionaryEvents.ADDED).subscribe((word: string) => {
                        this.snackBarService.openInfo(word);
                    });
                });
                this.updateDictionariesInfos();
            }
        });

        this.dictionaryVerificationService.globalVerification(dictionary);
        return subject;
    }

    async deleteDictionary(dictionarytoRemove: DictionaryInfo): Promise<void> {
        return await this.httpHandler.deleteDictionary(dictionarytoRemove.title);
    }

    async modifyDictionary(dictionaryInfo: ModifiedDictionaryInfo): Promise<void> {
        return await this.httpHandler.modifyDictionary(dictionaryInfo);
    }

    async resetDictionaries(): Promise<Dictionary[]> {
        return await this.httpHandler.resetDictionaries();
    }

    updateDictionariesInfos(): Subject<void> {
        const subject: Subject<void> = new Subject<void>();
        this.httpHandler.getDictionaries().then((dictionaryInfos: DictionaryInfo[]) => {
            this.dictionariesInfos = dictionaryInfos;
        });

        return subject;
    }

    getDictionary(title: string): Observable<Dictionary> {
        const subject: Subject<Dictionary> = new Subject<Dictionary>();
        this.httpHandler.getDictionary(title).then((dictionary: Dictionary) => {
            this.dictionary = dictionary;
            subject.next(this.dictionary);
        });

        return subject;
    }
}
