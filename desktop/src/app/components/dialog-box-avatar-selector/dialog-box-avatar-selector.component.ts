import { Component } from '@angular/core';

@Component({
    selector: 'app-dialog-box-avatar-selector',
    templateUrl: './dialog-box-avatar-selector.component.html',
    styleUrls: ['./dialog-box-avatar-selector.component.scss'],
})
export class DialogBoxAvatarSelectorComponent {
    protected imageSources: string[];

    constructor() {
        this.imageSources = [];
        this.imageSources.push('https://th.bing.com/th/id/OIP.xnUJy4yaRKK12eb2g-ZceQHaFo?pid=ImgDet&rs=1');
    }
}
