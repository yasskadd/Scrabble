/* eslint-disable deprecation/deprecation */
// TODO : Handle deprecation
import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { Dictionary } from '@app/interfaces/dictionary';
import { DictionaryInfo } from '@app/interfaces/dictionary-info';
import { HttpHandlerService } from '@app/services/communication/http-handler.service';
import { DictionaryVerificationService } from '@app/services/dictionary-verification.service';
import { Subject } from 'rxjs';
import { FileStatus } from '@common/models/file-status';
import { DictionaryEvents } from '@common/models/dictionary-events';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SNACKBAR_TIMEOUT } from '@common/constants/ui-events';

@Component({
    selector: 'app-import-dictionary',
    templateUrl: './import-dictionary.component.html',
    styleUrls: ['./import-dictionary.component.scss'],
})
export class ImportDictionaryComponent implements OnDestroy {
    @ViewChild('file', { static: false }) file: ElementRef;
    dictionaryList: DictionaryInfo[];
    selectedFile: Dictionary | null;
    errorMessage: string;

    constructor(
        private readonly httpHandler: HttpHandlerService,
        private dictionaryVerification: DictionaryVerificationService,
        private snackBar: MatSnackBar,
    ) {
        this.selectedFile = null;
        this.errorMessage = '';
    }

    ngOnDestroy() {
        this.dictionaryVerification.verificationStatus.unsubscribe();
    }

    uploadDictionary() {
        if (this.file.nativeElement.files.length === 0) {
            this.errorMessage = FileStatus.NONE_SELECTED;
            return;
        }

        const selectedFile = this.file.nativeElement.files[0];
        const fileReader = new FileReader();

        this.errorMessage = FileStatus.VERIFYING;
        this.readFile(selectedFile, fileReader).subscribe((content: string) => {
            if (content === FileStatus.READING_ERROR) {
                this.errorMessage = FileStatus.READING_ERROR;
                return;
            }

            try {
                this.fileOnLoad(JSON.parse(content));
            } catch (e) {
                this.errorMessage = FileStatus.NOT_JSON_ERROR;
            }
        });
    }

    fileOnLoad(newDictionary: Dictionary) {
        this.dictionaryVerification.verificationStatus.subscribe((error: string) => {
            if (error) {
                this.errorMessage = error;
            } else {
                this.selectedFile = newDictionary;
                this.httpHandler.addDictionary(this.selectedFile).subscribe(() => {
                    this.httpHandler.getDictionaries().subscribe((dictionaries) => (this.dictionaryList = dictionaries));
                    // TODO : Fermer
                    this.snackBar.open(DictionaryEvents.ADDED, 'Fermer', {
                        duration: SNACKBAR_TIMEOUT,
                        verticalPosition: 'bottom',
                    });
                });
            }
            this.file.nativeElement.value = '';
        });
        this.dictionaryVerification.globalVerification(newDictionary);
    }

    detectImportFile() {
        this.errorMessage = '';
        if (this.file.nativeElement.files.length === 0) {
            this.selectedFile = null;
        }
    }

    private readFile(selectedFile: File, fileReader: FileReader): Subject<string> {
        const subject = new Subject<string>();
        fileReader.readAsText(selectedFile, 'UTF-8');
        fileReader.onload = () => {
            subject.next(fileReader.result as string);
        };
        fileReader.onerror = () => {
            subject.next(FileStatus.READING_ERROR);
        };

        return subject;
    }
}
