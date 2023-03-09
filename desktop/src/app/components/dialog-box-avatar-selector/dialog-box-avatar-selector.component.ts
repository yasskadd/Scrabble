import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface AvatarDialogData {
    src: string;
}

@Component({
    selector: 'app-dialog-box-avatar-selector',
    templateUrl: './dialog-box-avatar-selector.component.html',
    styleUrls: ['./dialog-box-avatar-selector.component.scss'],
})
export class DialogBoxAvatarSelectorComponent {
    protected imageSources: string[];

    constructor(@Inject(MAT_DIALOG_DATA) private data: AvatarDialogData) {
        this.imageSources = [];
        for (let i = 0; i < 16; i++) {
            // this.imageSources.push(`https://source.unsplash.com/random/?cat?sig=${Math.floor(Math.random() * 10)}`);
            this.imageSources.push('https://th.bing.com/th/id/OIP.xnUJy4yaRKK12eb2g-ZceQHaFo?pid=ImgDet&rs=1');
        }
    }

    isImageSelected(imageSrc: string): boolean {
        return imageSrc === this.data.src;
    }
}
