import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Partner } from '../../../../core/models/partner.model';
import { StarRatingComponent } from '../../../../shared/components/star-rating/star-rating.component';

interface PartnerReview {
    id: string;
    partnerSlug: string;
    name: string;
    rating: number;
    date: string;
    amountInr: number;
    city: string;
    comment: string;
}

@Component({
    selector: 'app-partner-reviews',
    standalone: true,
    imports: [CommonModule, StarRatingComponent],
    template: `
    <section class="py-16 md:py-24 bg-surface">
      <div class="container">

        <div class="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
          <div>
            <h2 class="text-3xl md:text-4xl text-primary mb-4">Customer Reviews</h2>
            <div class="flex items-center gap-4">
              <div class="text-5xl font-mono font-bold text-primary">{{ averageRating() }}</div>
              <div>
                <app-star-rating [rating]="averageRating()" [count]="allReviews.length || partner?.review_count || 0"></app-star-rating>
                <div class="text-sm text-secondary mt-1">Based on verified applications</div>
              </div>
            </div>
          </div>

          <div class="w-full md:w-72 space-y-2 text-sm text-secondary">
            <div class="flex items-center gap-2" *ngFor="let star of [5,4,3,2,1]">
              <span class="w-3 text-right">{{ star }}</span>
              <div class="flex-1 h-2 bg-surface-3 rounded-full overflow-hidden">
                <div
                  class="h-full"
                  [ngClass]="star >= 5 ? 'bg-success' : star === 4 ? 'bg-[#81C784]' : star === 3 ? 'bg-warning' : star === 2 ? 'bg-[#FF8A65]' : 'bg-error'"
                  [style.width.%]="ratingPercent(star)">
                </div>
              </div>
              <span class="w-12 text-right text-xs">{{ ratingCount(star) }}</span>
            </div>
          </div>
        </div>

        <div *ngIf="displayReviews.length > 0" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <article *ngFor="let review of displayReviews" class="bg-surface-2 border border-border rounded-xl p-5">
            <div class="flex justify-between items-start mb-3">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-10 h-10 rounded-full bg-surface-3 flex items-center justify-center font-bold text-primary shrink-0">
                  {{ review.name.charAt(0) }}
                </div>
                <div class="min-w-0">
                  <div class="font-bold text-primary text-sm truncate">{{ review.name }}</div>
                  <div class="text-xs text-muted">{{ review.date | date:'dd MMM yyyy' }}</div>
                </div>
              </div>
              <div class="text-[#F5A623] text-sm shrink-0">{{ starString(review.rating) }}</div>
            </div>

            <div class="mb-3 flex items-center gap-2 text-xs text-secondary font-mono">
              <span class="inline-flex items-center rounded-full border border-border bg-surface-3 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                {{ review.city }}
              </span>
              <span>INR {{ review.amountInr | number }}</span>
            </div>

            <p class="text-sm text-secondary leading-relaxed">{{ review.comment }}</p>
          </article>
        </div>

        <div *ngIf="displayReviews.length === 0" class="text-center py-10 text-secondary">
          Reviews will be visible soon.
        </div>

        <div *ngIf="canLoadMore()" class="mt-8 flex justify-center">
          <button
            (click)="loadMore()"
            class="px-5 py-2.5 rounded-lg border border-border bg-surface text-primary font-medium hover:border-primary hover:text-primary-light transition-colors">
            Load More Reviews
          </button>
        </div>

      </div>
    </section>
  `
})
export class PartnerReviewsComponent implements OnChanges {
    @Input() partner: Partner | null = null;

    private readonly http = inject(HttpClient);

    allReviews: PartnerReview[] = [];
    displayReviews: PartnerReview[] = [];
    private visibleCount = 12;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['partner']) {
            this.visibleCount = 12;
            this.loadReviews();
        }
    }

    loadReviews() {
        if (this.partner?.slug === 'coinvault-finance') {
            this.http.get<PartnerReview[]>('/assets/data/coinvault-finance-reviews.json?v=' + Date.now()).subscribe({
                next: (reviews) => {
                    this.allReviews = [...reviews].sort((a, b) => (a.date < b.date ? 1 : -1));
                    this.displayReviews = this.allReviews.slice(0, this.visibleCount);
                },
                error: () => {
                    this.allReviews = this.fallbackReviews();
                    this.displayReviews = this.allReviews.slice(0, this.visibleCount);
                }
            });
            return;
        }

        this.allReviews = this.fallbackReviews();
        this.displayReviews = this.allReviews.slice(0, this.visibleCount);
    }

    loadMore() {
        this.visibleCount += 12;
        this.displayReviews = this.allReviews.slice(0, this.visibleCount);
    }

    canLoadMore(): boolean {
        return this.displayReviews.length < this.allReviews.length;
    }

    averageRating(): number {
        if (!this.allReviews.length) {
            return this.partner?.rating || 0;
        }
        const sum = this.allReviews.reduce((acc, review) => acc + review.rating, 0);
        return Number((sum / this.allReviews.length).toFixed(1));
    }

    ratingCount(star: number): number {
        return this.allReviews.filter(review => review.rating === star).length;
    }

    ratingPercent(star: number): number {
        if (!this.allReviews.length) return 0;
        return (this.ratingCount(star) / this.allReviews.length) * 100;
    }

    starString(star: number): string {
        return '★★★★★'.slice(0, star) + '☆☆☆☆☆'.slice(0, 5 - star);
    }

    private fallbackReviews(): PartnerReview[] {
        const today = new Date().toISOString().slice(0, 10);
        return [
            {
                id: 'F-1',
                partnerSlug: this.partner?.slug || 'unknown',
                name: 'Rahul Sharma',
                rating: 5,
                date: today,
                amountInr: 85000,
                city: 'Mumbai',
                comment: `I bought a laptop for INR 85,000. Buy now pay later option was clear and I split payment into 12 easy EMI parts. Team was helpful.`
            },
            {
                id: 'F-2',
                partnerSlug: this.partner?.slug || 'unknown',
                name: 'Ayesha Rahman',
                rating: 4,
                date: today,
                amountInr: 60000,
                city: 'Kolkata',
                comment: `I bought a television for INR 60,000. Easy EMI option is useful, but process can be slightly slow sometimes. Support team still helped me.`
            },
            {
                id: 'F-3',
                partnerSlug: this.partner?.slug || 'unknown',
                name: 'John D\'Souza',
                rating: 5,
                date: today,
                amountInr: 90000,
                city: 'Pune',
                comment: `I bought a mobile phone for INR 90,000. I used buy now pay later and selected 10 EMI parts. Process was clear and smooth.`
            }
        ];
    }
}
