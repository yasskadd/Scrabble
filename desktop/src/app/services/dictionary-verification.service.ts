import { Injectable } from '@angular/core';
import { Dictionary } from '@app/interfaces/dictionary';
import { HttpHandlerService } from './communication/http-handler.service';
import { GameConfigurationService } from './game-configuration.service';

const MAX_TITLE_CHAR = 30;
const MAX_DESCRIPTION_CHAR = 125;
const HTTP_STATUS_FOUND = 200;

@Injectable({
    providedIn: 'root',
})
export class DictionaryVerificationService {
    constructor(private readonly httpHandler: HttpHandlerService, public gameConfiguration: GameConfigurationService) {}

    async globalVerification(dictionary: unknown): Promise<string> {
        if (!this.isDictionary(dictionary))
            return "Le fichier téléversé n'est pas un dictionnaire. Les champs title, description ou words sont manquant.";
        if (this.fieldEmptyVerification(dictionary as Dictionary) !== 'Passed') return this.fieldEmptyVerification(dictionary as Dictionary);
        if (this.fieldLimitVerification(dictionary as Dictionary) !== 'Passed') return this.fieldLimitVerification(dictionary as Dictionary);
        const alreadyExist = await this.alreadyExist((dictionary as Dictionary).title);
        if (alreadyExist !== 'Passed') return alreadyExist;
        return 'Passed';
    }

    // Reason: we don't really what type of content the json file has.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private isDictionary(dictionary: any): boolean {
        if ('title' && 'description' && 'words' in dictionary) {
            if (typeof dictionary.title === 'string' && typeof dictionary.description === 'string' && this.wordsListIsValid(dictionary.words))
                return true;
            return false;
        }

        return false;
    }

    private fieldEmptyVerification(dictionary: Dictionary): string {
        if (this.fieldIsEmpty(dictionary.title)) return "Le dictionnaire n'a pas de titre";
        if (this.fieldIsEmpty(dictionary.description)) return "Le dictionnaire n'a pas de description";
        if (this.fieldIsEmpty(dictionary.words)) return "Le dictionnaire n'a pas une liste de mots";
        return 'Passed';
    }

    private fieldLimitVerification(dictionary: Dictionary): string {
        if (this.fieldCharacterLimit(dictionary.title.split(''), MAX_TITLE_CHAR)) return 'Le titre du dictionnaire est trop long!';
        if (this.fieldCharacterLimit(dictionary.description.split(''), MAX_DESCRIPTION_CHAR)) return 'La description du dictionnaire est trop long!';
        return 'Passed';
    }

    private fieldIsEmpty(field: unknown[] | string): boolean {
        if (typeof field === 'string') return (field as string).trim().length === 0;
        return field.length === 0;
    }

    private fieldCharacterLimit(array: unknown[], maxLimit: number): boolean {
        return array.length > maxLimit;
    }

    private async alreadyExist(title: string): Promise<string> {
        return this.httpHandler
            .dictionaryIsInDb(title)
            .toPromise()
            .then((response) => {
                return this.returnStatus(response.status);
            });
    }

    private returnStatus(response: number) {
        if (response === HTTP_STATUS_FOUND) return 'Le dictionnaire existe déjà dans la base de données';
        return 'Passed';
    }

    private wordsListIsValid(words: unknown): boolean {
        if (!Array.isArray(words)) return false;
        if (words.some((word) => !this.wordIsValid(word))) return false;
        return true;
    }

    private wordIsValid(word: unknown): boolean {
        if (typeof word !== 'string') return false;
        return /^[a-z][a-z]+$/.test(word as string);
    }
}
