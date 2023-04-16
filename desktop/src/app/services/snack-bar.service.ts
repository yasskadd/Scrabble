import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ErrorSnackBarComponent } from '@app/components/snack-bar/error/error-snack-bar.component';
import { InfoSnackBarComponent } from '@app/components/snack-bar/info/info-snack-bar.component';
import { SNACKBAR_ERROR_TIMEOUT, SNACKBAR_INFO_TIMEOUT } from '@common/constants/ui-events';

@Injectable({
    providedIn: 'root',
})
export class SnackBarService {
    constructor(private snackBar: MatSnackBar) {}

    openInfo(info: string) {
        this.snackBar.openFromComponent(InfoSnackBarComponent, {
            data: info,
            duration: SNACKBAR_INFO_TIMEOUT,
            verticalPosition: 'bottom',
            horizontalPosition: 'right',
        });
    }

    openEmailInfo(info: string) {
        this.snackBar.openFromComponent(ErrorSnackBarComponent, {
            data: info,
            duration: SNACKBAR_INFO_TIMEOUT,
            verticalPosition: 'top',
            horizontalPosition: 'center',
        });
    }

    openError(error: string) {
        this.snackBar.openFromComponent(ErrorSnackBarComponent, {
            data: error,
            duration: SNACKBAR_ERROR_TIMEOUT,
            verticalPosition: 'top',
            horizontalPosition: 'center',
        });
    }
}
