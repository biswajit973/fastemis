import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-star-rating',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="flex items-center gap-1">
      <ng-container *ngFor="let star of stars">
        <svg 
          width="16" height="16" viewBox="0 0 24 24" 
          [attr.fill]="star.filled ? 'currentColor' : 'none'" 
          [attr.stroke]="'currentColor'" 
          stroke-width="2" 
          stroke-linecap="round" stroke-linejoin="round" 
          class="text-[#F5A623]">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      </ng-container>
      <span *ngIf="rating" class="text-sm font-medium ml-1">{{ rating | number:'1.1-1' }}</span>
      <span *ngIf="count" class="text-xs text-muted ml-1">({{ count | number }})</span>
    </div>
  `
})
export class StarRatingComponent {
    @Input() rating: number = 0;
    @Input() count: number = 0;

    get stars() {
        return Array(5).fill(0).map((_, i) => ({
            filled: i < Math.round(this.rating)
        }));
    }
}
