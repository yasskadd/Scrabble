import { Dictionary } from '@app/interfaces/dictionary';
import { ModifiedDictionaryInfo } from '@common/interfaces/modified-dictionary-info';
import * as fs from 'fs';
import * as path from 'path';
import { Service } from 'typedi';

@Service()
export class DictionaryStorageService {
    async dictionaryIsInDb(fileName: string) {
        return await fs.promises.access(`./assets/${fileName}.json`, fs.constants.R_OK);
    }

    async addDictionary(fileName: string, data: string): Promise<void> {
        return await fs.promises.writeFile(`./assets/${fileName}.json`, data);
    }

    async deletedDictionary(fileName: string): Promise<void> {
        return await fs.promises.unlink(`./assets/${fileName}.json`);
    }

    async getDictionary(fileName: string): Promise<Buffer> {
        return await fs.promises.readFile(`./assets/${fileName}.json`);
    }

    async getDictionariesFileName(): Promise<string[]> {
        return (await fs.promises.readdir('./assets')).filter((file) => path.extname(file) === '.json');
    }

    async updateDictionary(dictionaryInfo: ModifiedDictionaryInfo) {
        const dictionaryToUpdate = JSON.parse((await this.getDictionary(dictionaryInfo.title)).toString());
        dictionaryToUpdate.title = dictionaryInfo.newTitle;
        dictionaryToUpdate.description = dictionaryInfo.newDescription;
        await this.deletedDictionary(dictionaryInfo.title);
        await this.addDictionary(dictionaryToUpdate.title, JSON.stringify(dictionaryToUpdate));
    }

    async getDictionaries(): Promise<Dictionary[]> {
        const jsonsInDir = (await fs.promises.readdir('././assets/')).filter((file) => path.extname(file) === '.json');
        const dictionaries = jsonsInDir.map((file) => {
            const fileData = fs.readFileSync(path.join('././assets/', file));
            const json = JSON.parse(fileData.toString());
            return json;
        });
        return dictionaries;
    }
}
