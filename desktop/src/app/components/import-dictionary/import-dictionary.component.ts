import { Component, ElementRef, ViewChild } from '@angular/core';
import { Dictionary } from '@app/interfaces/dictionary';
import { Subject } from 'rxjs';
import { FileStatus } from '@common/models/file-status';
import { DictionaryService } from '@services/dictionary.service';

@Component({
    selector: 'app-import-dictionary',
    templateUrl: './import-dictionary.component.html',
    styleUrls: ['./import-dictionary.component.scss'],
})
export class ImportDictionaryComponent {
    @ViewChild('file', { static: false }) file: ElementRef;
    selectedFile: Dictionary | null;
    errorMessage: string;

    constructor(private dictionaryService: DictionaryService) {
        this.selectedFile = null;
        this.errorMessage = '';
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
        this.dictionaryService.addDictionary(newDictionary).subscribe((res: string | Dictionary) => {
            if (typeof res === 'string') {
                this.errorMessage = res;
            }

            this.file.nativeElement.value = '';
        });
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
