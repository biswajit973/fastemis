import { Component, Input, Output, EventEmitter, forwardRef, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

@Component({
    selector: 'app-otp-input',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => OtpInputComponent),
            multi: true
        }
    ],
    template: `
    <div class="flex gap-3 justify-center">
      <input
        *ngFor="let digit of inputBoxes; let i = index"
        #otpInput
        type="tel"
        maxlength="1"
        class="w-14 h-14 text-center text-xl font-mono font-bold rounded-lg border focus:ring-2 focus:ring-primary focus:border-primary transition-standard bg-surface"
        [ngClass]="{
          'border-error focus:border-error focus:ring-error': error,
          'border-border': !error && !otpValues[i],
          'border-primary': !error && otpValues[i]
        }"
        [value]="otpValues[i]"
        (input)="onInput($event, i)"
        (keydown)="onKeyDown($event, i)"
        (paste)="onPaste($event)"
      />
    </div>
    <p *ngIf="error" class="mt-2 text-xs text-error text-center slide-up">{{ error }}</p>
  `
})
export class OtpInputComponent implements ControlValueAccessor {
    @Input() length: number = 6;
    @Input() error: string = '';
    @Output() completed = new EventEmitter<string>();

    @ViewChildren('otpInput') inputs!: QueryList<ElementRef<HTMLInputElement>>;

    get inputBoxes() {
        return Array(this.length).fill(0);
    }

    otpValues: string[] = Array(this.length).fill('');

    onChange: any = () => { };
    onTouched: any = () => { };

    onInput(event: Event, index: number) {
        const input = event.target as HTMLInputElement;
        const value = input.value;

        // Allow only numbers
        if (/[^0-9]/.test(value)) {
            input.value = this.otpValues[index];
            return;
        }

        this.otpValues[index] = value;
        this.updateValue();

        if (value && index < this.length - 1) {
            this.focusInput(index + 1);
        }
    }

    onKeyDown(event: KeyboardEvent, index: number) {
        if (event.key === 'Backspace' && !this.otpValues[index] && index > 0) {
            this.focusInput(index - 1);
        }
    }

    onPaste(event: ClipboardEvent) {
        event.preventDefault();
        const pastedData = event.clipboardData?.getData('text').slice(0, this.length).replace(/[^0-9]/g, '');
        if (pastedData) {
            this.otpValues = pastedData.split('').concat(Array(this.length).fill('')).slice(0, this.length);
            this.updateValue();

            const nextFocusIndex = Math.min(pastedData.length, this.length - 1);
            this.focusInput(nextFocusIndex);
        }
    }

    updateValue() {
        const val = this.otpValues.join('');
        this.onChange(val);
        if (val.length === this.length) {
            this.completed.emit(val);
        }
    }

    focusInput(index: number) {
        setTimeout(() => {
            this.inputs.toArray()[index].nativeElement.focus();
        }, 10);
    }

    // CVA
    writeValue(value: string): void {
        if (value) {
            this.otpValues = value.split('').concat(Array(this.length).fill('')).slice(0, this.length);
        } else {
            this.otpValues = Array(this.length).fill('');
        }
    }
    registerOnChange(fn: any): void { this.onChange = fn; }
    registerOnTouched(fn: any): void { this.onTouched = fn; }
}
