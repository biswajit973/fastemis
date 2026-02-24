import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-button',
    standalone: true,
    imports: [CommonModule],
    template: `
    <button 
      class="btn" 
      [ngClass]="'btn-' + variant + ' ' + (fullWidth ? 'w-full' : '')"
      [disabled]="disabled || loading"
      (click)="onClick.emit($event)">
      <span *ngIf="!loading" class="flex items-center justify-center gap-1">
        <ng-content></ng-content>
      </span>
      <span *ngIf="loading">Wait...</span>
    </button>
  `
})
export class ButtonComponent {
    @Input() variant: 'primary' | 'secondary' | 'ghost' | 'outline' = 'primary';
    @Input() disabled: boolean = false;
    @Input() loading: boolean = false;
    @Input() fullWidth: boolean = false;

    @Output() onClick = new EventEmitter<Event>();
}
