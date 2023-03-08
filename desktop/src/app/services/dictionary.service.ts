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
        const subscription = this.dictionaryVerificationService.verificationStatus.subscribe((error: string) => {
            if (error) {
                subject.next(error);
            } else {
                subject.next('');
                this.httpHandler.addDictionary(dictionary).subscribe(() => {
                    this.languageService.getWord(DictionaryEvents.ADDED).subscribe((word: string) => {
                        this.snackBarService.openInfo(word);
                    });
                });
                this.updateDictionariesInfos();
            }

            subscription.unsubscribe();
        });

        this.dictionaryVerificationService.globalVerification(dictionary);
        return subject;
    }

    deleteDictionary(dictionarytoRemove: DictionaryInfo): Observable<void> {
        return this.httpHandler.deleteDictionary(dictionarytoRemove.title);
    }

    modifyDictionary(dictionaryInfo: ModifiedDictionaryInfo): Observable<void> {
        return this.httpHandler.modifyDictionary(dictionaryInfo);
    }

    resetDictionaries(): Observable<Dictionary[]> {
        return this.httpHandler.resetDictionaries();
    }

    updateDictionariesInfos(): Subject<void> {
        const subject: Subject<void> = new Subject<void>();
        const subscription = this.httpHandler.getDictionaries().subscribe((dictionaryInfos: DictionaryInfo[]) => {
            this.dictionariesInfos = dictionaryInfos;
            subscription.unsubscribe();
        });

        return subject;
    }

    getDictionary(title: string): Observable<Dictionary> {
        const subject: Subject<Dictionary> = new Subject<Dictionary>();
        const subscription = this.httpHandler.getDictionary(title).subscribe((dictionary: Dictionary) => {
            this.dictionary = dictionary;
            subject.next(this.dictionary);
            subscription.unsubscribe();
        });

        return subject;
    }
}
