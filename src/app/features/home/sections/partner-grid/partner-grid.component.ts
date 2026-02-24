import { Component, Input, Output, EventEmitter, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Partner } from '../../../../core/models/partner.model';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { StarRatingComponent } from '../../../../shared/components/star-rating/star-rating.component';
import { CurrencyGlobalPipe } from '../../../../shared/pipes/custom.pipes';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-home-partner-grid',
  standalone: true,
  imports: [CommonModule, CardComponent, BadgeComponent, StarRatingComponent, CurrencyGlobalPipe, ButtonComponent, SkeletonComponent],
  template: `
    <section id="partnersList" class="py-16 md:py-24 bg-surface-2 min-h-screen">
      <div class="container">
        <div class="text-center mb-10">
          <h2 class="text-3xl md:text-4xl text-primary mb-3">Our Finance Partners</h2>
          <p class="text-secondary text-base lg:text-lg max-w-2xl mx-auto">
            30+ verified NBFC partners across India. All RBI compliant. All background verified.
          </p>
        </div>

        <!-- Filters -->
        <div class="flex overflow-x-auto hide-scrollbar gap-2 mb-10 pb-2 md:justify-center">
          <button *ngFor="let filter of filters" 
                  (click)="activeFilter.set(filter.id)"
                  class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-standard border"
                  [ngClass]="activeFilter() === filter.id ? 'bg-primary text-white border-primary' : 'bg-surface border-border text-secondary hover:border-primary-light'">
            {{ filter.label }}
          </button>
        </div>

        <!-- Loading State -->
        <div *ngIf="partners.length === 0" class="flex flex-col items-center justify-center py-12">
          <div class="relative w-16 h-16 mb-6">
            <div class="absolute inset-0 border-4 border-surface-3 rounded-full"></div>
            <div class="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
            <div class="absolute inset-0 flex items-center justify-center">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-primary"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            </div>
          </div>
          <h3 class="text-lg font-bold text-primary mb-2">Connecting to Partners...</h3>
          <p class="text-sm text-secondary mb-10">Fetching the latest offers from top licensed institutions.</p>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full opacity-50">
            <app-card *ngFor="let i of [1,2,3]" class="h-full block">
              <div class="flex items-start gap-3 mb-4">
                <app-skeleton width="48px" height="48px" borderRadius="12px"></app-skeleton>
                <div class="space-y-2">
                  <app-skeleton width="120px" height="20px"></app-skeleton>
                  <app-skeleton width="80px" height="12px"></app-skeleton>
                </div>
              </div>
              <app-skeleton width="100%" height="90px" borderRadius="8px" class="mb-4 block"></app-skeleton>
              <app-skeleton width="100%" height="40px" borderRadius="8px"></app-skeleton>
            </app-card>
          </div>
        </div>

        <!-- Grid -->
        <div *ngIf="partners.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <app-card *ngFor="let partner of filteredPartners(); trackBy: trackById" 
                    [hoverable]="true" class="h-full block"
                    (click)="onPartnerClick(partner)">
            
            <!-- Card Header -->
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm"
                     [style.background-color]="partner.color">
                  {{ partner.name.charAt(0) }}
                </div>
                <div>
                  <h3 class="font-bold text-lg text-primary leading-tight">{{ partner.name }}</h3>
                  <div class="text-xs text-muted mt-1">Verified Partner</div>
                </div>
              </div>
              
              <app-badge *ngIf="partner.rating >= 4.8" variant="success">⭐ Top Rated</app-badge>
            </div>

            <app-star-rating [rating]="partner.rating" [count]="partner.review_count" class="mb-4 block"></app-star-rating>

            <!-- Details Table -->
            <div class="bg-surface-2 rounded-lg p-3 mb-4 space-y-2 border border-border">
              <div class="flex justify-between text-sm">
                <span class="text-muted">Max Amount</span>
                <span class="font-mono font-medium text-primary">{{ partner.max_amount | currencyGlobal }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-muted">Processing Fee</span>
                <span class="font-medium text-primary">{{ partner.processing_fee }}%</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-muted">Tenure Options</span>
                <span class="font-medium text-primary">{{ partner.tenure_options.join('/') }} months</span>
              </div>
            </div>

            <!-- Trust Line -->
            <div class="flex items-center gap-2 text-xs text-muted mb-6">
              <span>Est. {{ partner.founded_year }}</span>
              <span>&bull;</span>
              <span *ngIf="partner.rbi_approved" class="flex items-center gap-1">Globally Regulated <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-success"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
              <span>&bull;</span>
              <span *ngIf="partner.nbfc_registered" class="flex items-center gap-1">Licensed <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-success"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
            </div>

            <!-- Blockquote Tagline -->
            <p class="text-sm font-medium text-secondary italic mb-6 border-l-2 border-primary-light pl-3 py-1">
              "{{ partner.tagline }}"
            </p>

            <!-- CTA -->
            <app-button 
              variant="primary" 
              [fullWidth]="true"
              (onClick)="onPartnerCtaClick($event, partner)">
              Check Eligibility &rarr;
            </app-button>
          </app-card>
        </div>
      </div>
    </section>
  `
})
export class HomePartnerGridComponent {
  @Input() partners: Partner[] = [];
  @Output() partnerSelect = new EventEmitter<Partner>();

  activeFilter = signal<string>('all');

  filters = [
    { id: 'all', label: 'All Partners' },
    { id: 'top-rated', label: '⭐ Top Rated' },
    { id: 'zero-fee', label: '0% Processing Fee' },
    { id: 'high-amount', label: 'Up to ₹5L' }
  ];

  filteredPartners = computed(() => {
    const filter = this.activeFilter();
    let result = this.partners;

    if (filter === 'top-rated') {
      result = result.filter(p => p.rating >= 4.8);
    } else if (filter === 'zero-fee') {
      result = result.filter(p => p.processing_fee === 0);
    } else if (filter === 'high-amount') {
      result = result.filter(p => p.max_amount >= 300000);
    }

    // Keep ordering consistent by rating only.
    return result.sort((a, b) => {
      return b.rating - a.rating;
    });
  });

  trackById(index: number, partner: Partner) {
    return partner.id;
  }

  onPartnerClick(partner: Partner) {
    this.partnerSelect.emit(partner);
  }

  onPartnerCtaClick(event: Event, partner: Partner) {
    event.stopPropagation();
    this.partnerSelect.emit(partner);
  }
}
