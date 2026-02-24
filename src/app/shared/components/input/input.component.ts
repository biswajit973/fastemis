import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule, FormControl } from '@angular/forms';

@Component({
    selector: 'app-input',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => InputComponent),
            multi: true
        }
    ],
    template: `
    <div class="input-wrapper mb-3">
      <label *ngIf="label" [for]="id" class="block text-sm font-medium text-secondary mb-1">
        {{ label }} <span *ngIf="required" class="text-error">*</span>
      </label>
      
      <div class="relative">
        <input
          [id]="id"
          [type]="type"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [value]="value"
          (input)="onInputChange($event)"
          (blur)="onTouched()"
          class="w-full text-base px-4 rounded-md border text-primary transition-standard"
          [ngClass]="{
            'border-error focus:border-error focus:ring-1 focus:ring-error': error,
            'border-border focus:border-primary focus:ring-1 focus:ring-primary': !error,
            'bg-surface-3 cursor-not-allowed': disabled,
            'bg-surface': !disabled,
            'font-mono': monospace
          }"
          style="min-height: 52px;"
        />
        
        <div *ngIf="showSuccessCheck && !error && value && value.length > 0" class="absolute right-4 top-1/2 -translate-y-1/2 text-success">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
      </div>
      
      <p *ngIf="error" class="mt-1 text-xs text-error slide-up">{{ error }}</p>
      <p *ngIf="hint && !error" class="mt-1 text-xs text-muted">{{ hint }}</p>
    </div>
  `
})
export class InputComponent implements ControlValueAccessor {
    @Input() id: string = `input-${Math.random().toString(36).substring(2, 9)}`;
    @Input() label: string = '';
    @Input() type: string = 'text';
    @Input() placeholder: string = '';
    @Input() error: string = '';
    @Input() hint: string = '';
    @Input() required: boolean = false;
    @Input() disabled: boolean = false;
    @Input() showSuccessCheck: boolean = false;
    @Input() monospace: boolean = false;

    value: string = '';

    onChange: any = () => { };
    onTouched: any = () => { };

    onInputChange(event: Event) {
        const val = (event.target as HTMLInputElement).value;
        this.value = val;
        this.onChange(val);
    }

    // ControlValueAccessor methods
    writeValue(value: any): void {
        this.value = value || '';
    }
    registerOnChange(fn: any): void {
        this.onChange = fn;
    }
    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }
    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }
}
