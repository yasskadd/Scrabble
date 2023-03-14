import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpHandlerService } from '@app/services/communication/http-handler.service';
import { AvatarData } from '@common/interfaces/avatar-data';
import { ImageType } from '@common/models/image-type';

@Component({
    selector: 'app-dialog-box-avatar-selector',
    templateUrl: './dialog-box-avatar-selector.component.html',
    styleUrls: ['./dialog-box-avatar-selector.component.scss'],
})
export class DialogBoxAvatarSelectorComponent {
    @ViewChild('image') private imageFile: ElementRef;

    protected defaultImages: AvatarData[];

    constructor(
        @Inject(MAT_DIALOG_DATA) private data: AvatarData,
        private dialogRef: MatDialogRef<DialogBoxAvatarSelectorComponent>,
        private httpHandlerService: HttpHandlerService,
    ) {
        this.initDefaultImages();
    }

    protected isImageSelected(imageSrc: string): boolean {
        return imageSrc === this.data?.url;
    }

    protected uploadImage(): void {
        if (this.imageFile.nativeElement.files) {
            const file: File = this.imageFile.nativeElement.files[0];

            const reader: FileReader = new FileReader();

            reader.addEventListener('load', (event: any) => {
                this.dialogRef.close({
                    type: ImageType.ImageData,
                    name: file.name,
                    rawData: event.target.result,
                    file,
                } as AvatarData);
            });

            reader.readAsDataURL(file);
        }
    }

    private initDefaultImages(): void {
        this.defaultImages = [];

        this.httpHandlerService.getDefaultImages().subscribe((map: Map<string, string[]>) => {
            Object.entries(map).forEach((entry: [string, string[]]) => {
                this.defaultImages.push({ type: ImageType.Url, name: entry[0], url: entry[1][0] } as AvatarData);
            });
        });
    }
}
