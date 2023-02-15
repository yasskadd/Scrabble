/* eslint-disable deprecation/deprecation */
// TODO : Handle deprecation
import { Component, ElementRef, ViewChild } from '@angular/core';
import { Dictionary } from '@app/interfaces/dictionary';
import { DictionaryInfo } from '@app/interfaces/dictionary-info';
import { HttpHandlerService } from '@app/services/communication/http-handler.service';
import { DictionaryVerificationService } from '@app/services/dictionary-verification.service';
import { Subject } from 'rxjs';
import { FileErrors } from '@common/models/file-errors';
import { DictionaryEvents } from '@common/models/dictionary-events';

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

    uploadDictionary() {
        if (this.file.nativeElement.files.length === 0) {
            this.updateDictionaryMessage("Il n'y a aucun fichier séléctioné", 'red');
            return;
        }

        const selectedFile = this.file.nativeElement.files[0];
        const fileReader = new FileReader();

        this.updateDictionaryMessage('En vérification, veuillez patienter...', 'red');
        this.readFile(selectedFile, fileReader).subscribe((content: string) => {
            if (content === FileErrors.READING) {
                this.updateDictionaryMessage(FileErrors.READING, 'red');
                return;
            }

            try {
                this.fileOnLoad(JSON.parse(content));
            } catch (e) {
                this.updateDictionaryMessage(FileErrors.NOT_JSON, 'red');
            }
        });
    }

    fileOnLoad(newDictionary: Dictionary) {
        this.dictionaryVerification.globalVerification(newDictionary).subscribe((errorMessage: string) => {
            if (errorMessage) {
                this.updateDictionaryMessage(errorMessage, 'red');
            } else {
                this.selectedFile = newDictionary;
                this.httpHandler.addDictionary(this.selectedFile).subscribe(() => {
                    this.httpHandler.getDictionaries().subscribe((dictionaries) => (this.dictionaryList = dictionaries));
                    this.updateDictionaryMessage(DictionaryEvents.ADDED, 'black');
                });
            }
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

    private readFile(selectedFile: File, fileReader: FileReader): Subject<string> {
        const subject = new Subject<string>();
        fileReader.readAsText(selectedFile, 'UTF-8');
        fileReader.onload = () => {
            subject.next(fileReader.result as string);
        };
        fileReader.onerror = (e: any) => {
            subject.next(FileErrors.READING);
        };

        return subject;
    }
}
