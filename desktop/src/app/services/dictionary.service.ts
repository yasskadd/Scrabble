import { Injectable } from '@angular/core';
import { Dictionary } from '@app/interfaces/dictionary';
import { DictionaryInfo } from '@app/interfaces/dictionary-info';
import { ModifiedDictionaryInfo } from '@common/interfaces/modified-dictionary-info';
import { HttpHandlerService } from './communication/http-handler.service';

export interface FileError {
    message: string;
    color: string;
}

@Injectable({
    providedIn: 'root',
})
export class DictionaryService {
    constructor(private readonly httpHandler: HttpHandlerService) {}

    async addDictionary(dictionary: Dictionary): Promise<DictionaryInfo[]> {
        this.httpHandler.addDictionary(dictionary).subscribe();
        return this.getDictionaries();
    }

    async deleteDictionary(dictionarytoRemove: DictionaryInfo): Promise<void> {
        return this.httpHandler.deleteDictionary(dictionarytoRemove.title).toPromise();
    }

    async modifyDictionary(dictionaryInfo: ModifiedDictionaryInfo): Promise<void> {
        return this.httpHandler.modifyDictionary(dictionaryInfo).toPromise();
    }

    async resetDictionaries(): Promise<Dictionary[]> {
        return this.httpHandler.resetDictionaries().toPromise();
    }

    async getDictionaries(): Promise<DictionaryInfo[]> {
        return this.httpHandler.getDictionaries().toPromise();
    }

    async getDictionary(title: string): Promise<Dictionary> {
        return this.httpHandler.getDictionary(title).toPromise();
    }
}
