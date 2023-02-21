import { Component, Inject, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';

@Component({
    selector: 'app-error-snackbar',
    templateUrl: './error-snack-bar.component.html',
    styleUrls: ['./error-snack-bar.component.scss'],
})
export class ErrorSnackBarComponent {
    snackBarRef = inject(MatSnackBarRef);

    constructor(@Inject(MAT_SNACK_BAR_DATA) public data: string) {}
}
