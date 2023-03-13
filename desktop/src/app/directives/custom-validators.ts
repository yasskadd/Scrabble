/* eslint-disable prefer-arrow/prefer-arrow-functions */
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function equalStringValidator(value: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | undefined => {
        const isEqualString: boolean = control.value !== value;

        return isEqualString ? { equalString: { value } } : undefined;
    };
}
