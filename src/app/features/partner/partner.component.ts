import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Partner } from '../../core/models/partner.model';
import { PartnerService } from '../../core/services/partner.service';
import { PartnerNavbarComponent } from './sections/partner-navbar/partner-navbar.component';
import { PartnerHeroComponent } from './sections/partner-hero/partner-hero.component';
import { PartnerOfferingsComponent } from './sections/partner-offerings/partner-offerings.component';
import { PartnerReviewsComponent } from './sections/partner-reviews/partner-reviews.component';
import { PartnerFaqComponent } from './sections/partner-faq/partner-faq.component';
import { HomeFooterComponent } from '../home/sections/footer/footer.component';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-partner',
    standalone: true,
    imports: [
        CommonModule,
        PartnerNavbarComponent,
        PartnerHeroComponent,
        PartnerOfferingsComponent,
        PartnerReviewsComponent,
        PartnerFaqComponent,
        HomeFooterComponent
    ],
    template: `
    <ng-container *ngIf="partner; else loading">
      <app-partner-navbar [partner]="partner"></app-partner-navbar>
      
      <main class="min-h-screen">
        <app-partner-hero [partner]="partner"></app-partner-hero>
        <app-partner-offerings [partner]="partner"></app-partner-offerings>
        <app-partner-reviews [partner]="partner"></app-partner-reviews>
        <app-partner-faq [partner]="partner"></app-partner-faq>
      </main>

      <app-home-footer></app-home-footer>
    </ng-container>

    <ng-template #loading>
      <div class="fixed inset-0 bg-surface flex items-center justify-center z-50">
        <div class="w-12 h-12 border-4 border-surface-3 border-t-primary rounded-full animate-spin"></div>
      </div>
    </ng-template>
  `
})
export class PartnerComponent implements OnInit, OnDestroy {
    partner: Partner | null = null;
    private routeSub!: Subscription;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private partnerService: PartnerService
    ) { }

    ngOnInit() {
        this.routeSub = this.route.paramMap.subscribe(params => {
            const slug = params.get('slug');
            if (slug) {
                this.loadPartner(slug);
            } else {
                this.router.navigate(['/']);
            }
        });
    }

    loadPartner(slug: string) {
        this.partnerService.getPartnerBySlug(slug).subscribe({
            next: (partner) => {
                this.partner = partner || null;
            },
            error: () => {
                // If partner not found, go back home
                this.router.navigate(['/']);
            }
        });
    }

    ngOnDestroy() {
        if (this.routeSub) {
            this.routeSub.unsubscribe();
        }
        // We do NOT clear active partner here.
        // We want the partner color theme to persist if they navigate to /dashboard or /apply.
        // It's only cleared explicitly on the Home page.
    }
}
