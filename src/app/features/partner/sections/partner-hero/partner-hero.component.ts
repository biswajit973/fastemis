import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Partner } from '../../../../core/models/partner.model';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CurrencyGlobalPipe } from '../../../../shared/pipes/custom.pipes';

@Component({
  selector: 'app-partner-hero',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonComponent, CurrencyGlobalPipe],
  template: `
    <section class="relative pt-32 pb-20 overflow-hidden" [style.background-color]="partner?.color || 'var(--primary)'">
      <!-- Background pattern -->
      <div class="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="partner-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#FFFFFF" stroke-width="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#partner-grid)" />
        </svg>
      </div>

      <div class="container relative z-10 text-center md:text-left flex flex-col md:flex-row items-center gap-12">
        <div class="flex-1 text-white fade-in">
          <h1 class="font-display text-4xl md:text-5xl lg:text-6xl leading-tight mb-4">
            Finance Up to {{ partner?.max_amount | currencyGlobal }}.<br/>
            Zero Processing Fee.*
          </h1>
          
          <p class="text-white/80 text-lg md:text-xl max-w-xl mb-8">
            Trusted by {{ partner?.review_count | number }} customers across India.<br/>
            RBI Compliant • NBFC Registered • Est. {{ partner?.founded_year }}
          </p>
          
          <div class="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <app-button variant="primary" [fullWidth]="false" 
                       class="!bg-white !text-[#0A2540] hover:!bg-surface-2 shadow-lg"
                       [routerLink]="['/partner', partner?.slug, 'apply']">
              Apply for EMI &rarr;
            </app-button>
            <app-button variant="outline" [fullWidth]="false" 
                       class="!border-white !text-white hover:!bg-white/10">
              Read Reviews
            </app-button>
          </div>
        </div>
        
        <div class="hidden md:flex flex-1 justify-center scale-in">
          <!-- Trust Card Summary -->
          <div class="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl max-w-sm w-full">
            <h3 class="text-white font-bold text-xl mb-6">Partner Highlights</h3>
            
            <div class="space-y-4">
              <div class="flex items-center gap-4 text-white">
                <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">⭐</div>
                <div>
                  <div class="text-sm text-white/70">Average Rating</div>
                  <div class="font-bold font-mono">{{ partner?.rating }}/5.0</div>
                </div>
              </div>
              <div class="flex items-center gap-4 text-white">
                <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">💰</div>
                <div>
                  <div class="text-sm text-white/70">Disbursed</div>
                  <div class="font-bold font-mono">₹500Cr+</div>
                </div>
              </div>
              <div class="flex items-center gap-4 text-white">
                <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">⚡</div>
                <div>
                  <div class="text-sm text-white/70">Processing Time</div>
                  <div class="font-bold">Max 72 Hours</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
})
export class PartnerHeroComponent {
  @Input() partner: Partner | null = null;
}
