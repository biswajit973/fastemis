import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { Partner } from '../../../../core/models/partner.model';

@Component({
  selector: 'app-partner-offerings',
  standalone: true,
  imports: [CommonModule, CardComponent],
  template: `
    <section class="py-16 bg-surface-2 border-b border-border">
      <div class="container text-center max-w-5xl">
        <h2 class="text-2xl md:text-3xl font-display text-primary mb-10">Flexible EMI Plans</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          
          <!-- Plan 1 -->
          <app-card [hoverable]="true" class="h-full border-t-4" [style.border-top-color]="partner?.color">
            <h3 class="font-bold text-xl text-primary mb-1 text-center">6 Months</h3>
            <p class="text-center text-sm text-muted mb-6 font-medium uppercase tracking-wider">Quick Pay</p>
            
            <ul class="space-y-3 mb-6">
              <li class="flex justify-between items-center text-sm border-b border-border pb-2">
                <span class="text-secondary">Amount</span>
                <span class="font-mono font-medium text-primary">$500 - $10k</span>
              </li>
              <li class="flex justify-between items-center text-sm border-b border-border pb-2">
                <span class="text-secondary">Processing Fee</span>
                <span class="font-medium text-success">0%</span>
              </li>
              <li class="flex justify-between items-center text-sm pb-2">
                <span class="text-secondary">Verification</span>
                <span class="font-medium text-primary">Fast BGV</span>
              </li>
            </ul>
          </app-card>

          <!-- Plan 2 -->
          <app-card [hoverable]="true" class="h-full border-t-4 transform md:-translate-y-4 rounded-xl shadow-lg relative" [style.border-top-color]="partner?.color">
            <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-[10px] font-bold uppercase py-1 px-3 rounded-full">Most Popular</div>
            <h3 class="font-bold text-xl text-primary mb-1 text-center">12 Months</h3>
            <p class="text-center text-sm text-muted mb-6 font-medium uppercase tracking-wider">Balanced</p>
            
            <ul class="space-y-3 mb-6">
              <li class="flex justify-between items-center text-sm border-b border-border pb-2">
                <span class="text-secondary">Amount</span>
                <span class="font-mono font-medium text-primary">$3,000 - $ {{ partner ? (partner.max_amount / 1000) : 10 }}k</span>
              </li>
              <li class="flex justify-between items-center text-sm border-b border-border pb-2">
                <span class="text-secondary">Processing Fee</span>
                <span class="font-medium text-success">{{ partner?.processing_fee || 0 }}%</span>
              </li>
              <li class="flex justify-between items-center text-sm pb-2">
                <span class="text-secondary">Verification</span>
                <span class="font-medium text-primary">Standard</span>
              </li>
            </ul>
          </app-card>

          <!-- Plan 3 -->
          <app-card [hoverable]="true" class="h-full border-t-4" [style.border-top-color]="partner?.color">
            <h3 class="font-bold text-xl text-primary mb-1 text-center">24 Months</h3>
            <p class="text-center text-sm text-muted mb-6 font-medium uppercase tracking-wider">Easy Pay</p>
            
            <ul class="space-y-3 mb-6">
              <li class="flex justify-between items-center text-sm border-b border-border pb-2">
                <span class="text-secondary">Amount</span>
                <span class="font-mono font-medium text-primary">$5,000 - $ {{ partner ? (partner.max_amount / 1000) : 10 }}k</span>
              </li>
              <li class="flex justify-between items-center text-sm border-b border-border pb-2">
                <span class="text-secondary">Processing Fee</span>
                <span class="font-medium text-primary">1%</span>
              </li>
              <li class="flex justify-between items-center text-sm pb-2">
                <span class="text-secondary">Verification</span>
                <span class="font-medium text-primary">Flexible</span>
              </li>
            </ul>
          </app-card>

        </div>
      </div>
    </section>
  `
})
export class PartnerOfferingsComponent {
  @Input() partner: Partner | null = null;
}
