import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-card',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div 
      class="card-base transition-standard"
      [ngClass]="{
        'hover:-translate-y-1 hover:shadow-md cursor-pointer': hoverable,
        'border border-border': bordered,
        'p-0': noPadding
      }">
      <ng-content></ng-content>
    </div>
  `
})
export class CardComponent {
    @Input() hoverable: boolean = false;
    @Input() bordered: boolean = false;
    @Input() noPadding: boolean = false;
}
