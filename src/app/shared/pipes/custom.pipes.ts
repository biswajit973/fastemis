import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'currencyGlobal',
    standalone: true
})
export class CurrencyGlobalPipe implements PipeTransform {
    transform(value: number | string | null | undefined): string {
        if (value === null || value === undefined) return '';
        const val = Number(value);
        if (isNaN(val)) return String(value);

        // Format in Indian Rupees for detected/default country experience.
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(val);
    }
}

@Pipe({
    name: 'maskNumber',
    standalone: true
})
export class MaskNumberPipe implements PipeTransform {
    transform(value: string | null | undefined, type: 'taxId' | 'nationalId' | 'phone' = 'taxId'): string {
        if (!value) return '';

        if (type === 'taxId' && value.length >= 5) {
            return value.substring(0, value.length - 4).replace(/./g, 'X') + value.substring(value.length - 4);
        }
        if (type === 'nationalId' && value.length >= 8) {
            // remove dashes if any
            const clean = value.replace(/-/g, '');
            return 'XXXX-XXXX-' + clean.substring(8, 12);
        }
        if (type === 'phone' && value.length >= 10) {
            return 'XXXXXX' + value.substring(value.length - 4);
        }

        return value;
    }
}

@Pipe({
    name: 'timeAgo',
    standalone: true
})
export class TimeAgoPipe implements PipeTransform {
    transform(value: string | Date | null | undefined): string {
        if (!value) return '';

        const d = new Date(value);
        const now = new Date();
        const seconds = Math.round(Math.abs((now.getTime() - d.getTime()) / 1000));
        const minutes = Math.round(Math.abs(seconds / 60));
        const hours = Math.round(Math.abs(minutes / 60));
        const days = Math.round(Math.abs(hours / 24));

        if (Number.isNaN(seconds)) return '';

        if (seconds <= 45) return 'just now';
        if (seconds <= 90) return 'a minute ago';
        if (minutes <= 45) return `${minutes} minutes ago`;
        if (minutes <= 90) return 'an hour ago';
        if (hours <= 22) return `${hours} hours ago`;
        if (hours <= 36) return 'a day ago';
        if (days <= 25) return `${days} days ago`;
        if (days <= 45) return 'a month ago';

        return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    }
}
