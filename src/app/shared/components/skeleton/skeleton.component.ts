import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-skeleton',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div 
      class="animate-pulse bg-surface-3 rounded"
      [style.width]="width"
      [style.height]="height"
      [ngClass]="{
        'rounded-full': type === 'circle',
        'rounded-md': type === 'rect'
      }">
    </div>
  `
})
export class SkeletonComponent {
    @Input() width: string = '100%';
    @Input() height: string = '20px';
    @Input() type: 'rect' | 'circle' = 'rect';
}
