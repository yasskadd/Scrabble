import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface DialogData {
    currentName: string;
    newName: string;
}

@Component({
    selector: 'app-dialog-box-modify-bot-names',
    templateUrl: './dialog-box-modify-bot-names.component.html',
    styleUrls: ['./dialog-box-modify-bot-names.component.scss'],
})
export class DialogBoxModifyBotNamesComponent {
    constructor(public dialogRef: MatDialogRef<DialogBoxModifyBotNamesComponent>, @Inject(MAT_DIALOG_DATA) public data: DialogData) {}
    onNoClick(): void {
        this.dialogRef.close();
    }
}
