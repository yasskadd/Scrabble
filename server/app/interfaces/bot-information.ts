import { DictionaryValidation } from '@app/classes/dictionary-validation.class';

export interface BotInformation {
    timer: number;
    roomId: string;
    dictionaryValidation: DictionaryValidation;
}
