import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-badge',
    standalone: true,
    imports: [CommonModule],
    template: `
    <span 
      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
      [ngClass]="{
        'bg-accent-soft text-accent': variant === 'success',
        'bg-[#FFF3E0] text-warning': variant === 'warning',
        'bg-[#FFEBEE] text-error': variant === 'error',
        'bg-surface-3 text-secondary': variant === 'neutral',
        'bg-primary text-white': variant === 'primary'
      }">
      <ng-content></ng-content>
    </span>
  `
})
export class BadgeComponent {
    @Input() variant: 'success' | 'warning' | 'error' | 'neutral' | 'primary' = 'neutral';
}
