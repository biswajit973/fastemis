import { Directive, HostListener, ElementRef } from '@angular/core';

@Directive({
    selector: '[appNumberOnly]',
    standalone: true
})
export class NumberOnlyDirective {
    constructor(private el: ElementRef) { }

    @HostListener('input', ['$event']) onInputChange(event: Event) {
        const input = this.el.nativeElement;
        const initialValue = input.value;
        input.value = initialValue.replace(/[^0-9]*/g, '');
        if (initialValue !== input.value) {
            event.stopPropagation();
        }
    }
}

@Directive({
    selector: '[appTaxIdFormat]',
    standalone: true
})
export class TaxIdFormatDirective {
    constructor(private el: ElementRef) { }

    @HostListener('input', ['$event']) onInputChange(event: Event) {
        const input = this.el.nativeElement;
        let val = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 15);
        input.value = val;
    }
}

@Directive({
    selector: '[appNationalIdFormat]',
    standalone: true
})
export class NationalIdFormatDirective {
    constructor(private el: ElementRef) { }

    @HostListener('input', ['$event']) onInputChange(event: Event) {
        const input = this.el.nativeElement;
        let val = input.value.replace(/\D/g, '').substring(0, 15);
        let newVal = '';
        for (let i = 0; i < val.length; i++) {
            if (i > 0 && i % 4 === 0) newVal += '-';
            newVal += val[i];
        }
        input.value = newVal;
    }
}
