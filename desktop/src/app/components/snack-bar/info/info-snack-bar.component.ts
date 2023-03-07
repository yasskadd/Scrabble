import { Component, Inject, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';

@Component({
    selector: 'app-info-snackbar',
    templateUrl: './info-snack-bar.component.html',
    styleUrls: ['./info-snack-bar.component.scss'],
})
export class InfoSnackBarComponent {
    snackBarRef = inject(MatSnackBarRef);

    constructor(@Inject(MAT_SNACK_BAR_DATA) public data: string) {}
}
