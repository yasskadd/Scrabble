import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-dialog-box-create-chat',
    templateUrl: './dialog-box-create-chat.component.html',
    styleUrls: ['./dialog-box-create-chat.component.scss'],
})
export class DialogBoxCreateChatComponent {
    constructor(@Inject(MAT_DIALOG_DATA) public data: any, private dialogRef: MatDialogRef<DialogBoxCreateChatComponent>) {}

    onNoClick(): void {
        this.dialogRef.close();
    }
}
