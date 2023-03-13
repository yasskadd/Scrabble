import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AvatarData } from '@common/interfaces/avatar-data';
import { ImageType } from '@common/models/image-type';

@Component({
    selector: 'app-dialog-box-avatar-selector',
    templateUrl: './dialog-box-avatar-selector.component.html',
    styleUrls: ['./dialog-box-avatar-selector.component.scss'],
})
export class DialogBoxAvatarSelectorComponent {
    @ViewChild('image') private imageFile: ElementRef;

    protected imageSources: string[];

    constructor(@Inject(MAT_DIALOG_DATA) private data: AvatarData, private dialogRef: MatDialogRef<DialogBoxAvatarSelectorComponent>) {
        this.imageSources = [];
        const numberOfImages = 2 ** (2 ** 2);
        for (let i = 0; i < numberOfImages; i++) {
            // TODO : Add default images
            // this.imageSources.push(`https://source.unsplash.com/random/?cat?sig=${Math.floor(Math.random() * 10)}`);
            this.imageSources.push('https://th.bing.com/th/id/OIP.xnUJy4yaRKK12eb2g-ZceQHaFo?pid=ImgDet&rs=1');
        }
    }

    protected closeDialog(imageSource: string): void {
        this.dialogRef.close({
            type: ImageType.Url,
            src: imageSource,
        });
    }

    protected isImageSelected(imageSrc: string): boolean {
        if (this.data.type === ImageType.Url) {
            return imageSrc === this.data.src;
        }

        return false;
    }

    protected uploadImage(): void {
        if (this.imageFile.nativeElement.files) {
            const file: File = this.imageFile.nativeElement.files[0];
            const reader: FileReader = new FileReader();

            reader.addEventListener('load', (event: any) => {
                this.dialogRef.close({ type: ImageType.ImageData, src: file.name, data: event.target.result });
            });

            reader.readAsDataURL(file);
        }
    }
}
