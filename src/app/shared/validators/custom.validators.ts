import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CustomValidators {

    static taxId(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!control.value) return null;
            const taxRegex = /^[A-Z0-9]{5,15}$/;
            const valid = taxRegex.test(control.value.toUpperCase());
            return valid ? null : { invalidTaxId: true };
        };
    }

    static nationalId(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!control.value) return null;
            const clean = control.value.replace(/-/g, '');
            const valid = /^[0-9]{8,15}$/.test(clean);
            return valid ? null : { invalidNationalId: true };
        };
    }

    static phone(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!control.value) return null;
            const valid = /^[6-9]\d{9}$/.test(control.value);
            return valid ? null : { invalidPhone: true };
        };
    }

    static passwordMatch(passwordKey: string, confirmPasswordKey: string): ValidatorFn {
        return (group: AbstractControl): ValidationErrors | null => {
            const password = group.get(passwordKey)?.value;
            const confirmPassword = group.get(confirmPasswordKey)?.value;
            if (password !== confirmPassword) {
                group.get(confirmPasswordKey)?.setErrors({ passwordMismatch: true });
                return { passwordMismatch: true };
            }
            return null;
        };
    }
}
