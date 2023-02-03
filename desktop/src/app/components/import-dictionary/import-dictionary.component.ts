import { Component, ElementRef, ViewChild } from '@angular/core';
import { Dictionary } from '@app/interfaces/dictionary';
import { DictionaryInfo } from '@app/interfaces/dictionary-info';
import { HttpHandlerService } from '@app/services/communication/http-handler.service';
import { DictionaryVerificationService } from '@app/services/dictionary-verification.service';

@Component({
    selector: 'app-import-dictionary',
    templateUrl: './import-dictionary.component.html',
    styleUrls: ['./import-dictionary.component.scss'],
})
export class ImportDictionaryComponent {
    @ViewChild('file', { static: false }) file: ElementRef;
    @ViewChild('fileError', { static: false }) fileError: ElementRef;
    dictionaryList: DictionaryInfo[];
    selectedFile: Dictionary | null;

    constructor(private readonly httpHandler: HttpHandlerService, private dictionaryVerification: DictionaryVerificationService) {
        this.selectedFile = null;
    }

    async uploadDictionary() {
        if (this.file.nativeElement.files.length === 0) {
            this.updateDictionaryMessage("Il n'y a aucun fichier séléctioné", 'red');
            return;
        }
        const selectedFile = this.file.nativeElement.files[0];
        const fileReader = new FileReader();
        const content = await this.readFile(selectedFile, fileReader);
        this.updateDictionaryMessage('En vérification, veuillez patienter...', 'red');
        await this.fileOnLoad(content);
    }

    async fileOnLoad(newDictionary: Record<string, unknown>) {
        const globalVerification = await this.dictionaryVerification.globalVerification(newDictionary);
        if (globalVerification !== 'Passed') {
            this.updateDictionaryMessage(globalVerification, 'red');
            return;
        }
        this.selectedFile = newDictionary as unknown as Dictionary;
        this.httpHandler
            .addDictionary(this.selectedFile)
            .toPromise()
            .then(() => {
                this.httpHandler.getDictionaries().subscribe((dictionaries) => (this.dictionaryList = dictionaries));
                this.updateDictionaryMessage('Ajout avec succès du nouveau dictionnaire', 'black');
            });
    }

    detectImportFile() {
        this.fileError.nativeElement.textContent = '';
        if (this.file.nativeElement.files.length === 0) this.selectedFile = null;
    }

    updateDictionaryMessage(message: string, color: string) {
        this.fileError.nativeElement.textContent = message;
        this.fileError.nativeElement.style.color = color;
    }

    private async readFile(selectedFile: File, fileReader: FileReader): Promise<Record<string, unknown>> {
        return new Promise((resolve, reject) => {
            fileReader.readAsText(selectedFile, 'UTF-8');
            fileReader.onload = () => {
                resolve(JSON.parse(fileReader.result as string));
            };
            fileReader.onerror = () => {
                reject(Error('File is not a JSON'));
            };
        });
    }
}
