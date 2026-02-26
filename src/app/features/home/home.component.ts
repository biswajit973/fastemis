import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { HomeHeroComponent } from './sections/hero/hero.component';
import { HomeStatsComponent } from './sections/stats-bar/stats-bar.component';
import { HomeHowItWorksComponent } from './sections/how-it-works/how-it-works.component';
import { HomePartnerGridComponent } from './sections/partner-grid/partner-grid.component';
import { HomeTrustComponent } from './sections/trust-signals/trust-signals.component';
import { HomeFaqComponent } from './sections/faq/faq.component';
import { HomeFooterComponent } from './sections/footer/footer.component';
import { LocationCheckComponent } from './sections/location-check/location-check.component';
import { TopEmiDevicesComponent } from './sections/top-emi-devices/top-emi-devices.component';
import { Partner } from '../../core/models/partner.model';
import { PartnerService } from '../../core/services/partner.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    HomeHeroComponent,
    HomeStatsComponent,
    HomeHowItWorksComponent,
    TopEmiDevicesComponent,
    HomePartnerGridComponent,
    HomeTrustComponent,
    HomeFaqComponent,
    HomeFooterComponent,
    LocationCheckComponent
  ],
  template: `
    <app-navbar></app-navbar>
    
    <main class="min-h-screen">
      <app-home-hero></app-home-hero>
      <app-home-stats></app-home-stats>
      <app-home-how-it-works></app-home-how-it-works>
      <app-top-emi-devices></app-top-emi-devices>
      <app-home-partner-grid 
        [partners]="partners()"
        (partnerSelect)="onPartnerSelected($event)">
      </app-home-partner-grid>
      <app-home-trust></app-home-trust>
      <app-home-faq></app-home-faq>
    </main>

    <app-home-footer></app-home-footer>

    <app-location-check #locationModal></app-location-check>

    <!-- Live EMI Plan Approval Toast Notification -->
    <div *ngIf="activeNotification()" class="fixed bottom-6 left-6 z-50 slide-up max-w-sm">
      <div class="bg-surface/90 backdrop-blur-md border border-border shadow-2xl rounded-2xl p-4 flex items-start gap-4 hover:scale-105 transition-transform cursor-default">
        <div class="w-10 h-10 rounded-full bg-success/20 text-success flex items-center justify-center shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        </div>
        <div class="flex-1">
          <p class="text-xs font-bold text-success uppercase tracking-wider mb-0.5">EMI Plan Approved</p>
          <p class="text-sm font-medium text-primary leading-snug">
            <span class="font-bold">{{ activeNotification()?.name }}</span> just got approved for <span class="font-mono font-bold text-success">{{ activeNotification()?.amount }}</span> via FastEMIs from {{ activeNotification()?.partner }}.
          </p>
          <p class="text-[10px] text-muted mt-1">{{ activeNotification()?.timeAgo }}</p>
        </div>
        <button (click)="dismissNotification()" class="absolute top-2 right-2 text-secondary hover:text-error transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    </div>
  `
})
export class HomeComponent implements OnInit {
  partners = signal<Partner[]>([]);
  activeNotification = signal<{ name: string, amount: string, partner: string, timeAgo: string } | null>(null);
  private timerInterval: any;
  private displayTimeout: any;

  @ViewChild('locationModal') locationModal!: LocationCheckComponent;

  constructor(private partnerService: PartnerService) { }

  async ngOnInit() {
    this.partnerService.clearActivePartner(); // Reset theme on home
    try {
      const data = await firstValueFrom(this.partnerService.loadAllPartners());
      this.partners.set(data as Partner[]);
    } catch (e) {
      console.error('Could not load partners data', e);
    }

    this.startFakeNotifications();
  }

  onPartnerSelected(partner: Partner) {
    this.locationModal.open(partner);
  }

  startFakeNotifications() {
    const names = [
      'Michael Sterling', 'Sarah Jenkins', 'David Rossi', 'Emma Chen', 'William Hayes',
      'Jessica Miller', 'Anthony Cruz', 'Olivia Bennett', 'Daniel Kim', 'Sophia Martinez',
      'Lucas Silva', 'Elena Ivanov'
    ];
    const partners = ['Chase Bank', 'Bank of America', 'Wells Fargo', 'Citibank', 'Barclays', 'HSBC', 'Standard Chartered'];
    const times = ['Just now', '1m ago', '2m ago', '30s ago'];

    // Initial pop after 3 seconds
    setTimeout(() => this.triggerRandomNotification(names, partners, times), 3000);

    // Then random every 15-45 seconds
    this.scheduleNextNotification(names, partners, times);
  }

  scheduleNextNotification(names: string[], partners: string[], times: string[]) {
    const randomDelay = Math.floor(Math.random() * (45000 - 15000 + 1) + 15000); // 15s to 45s
    this.timerInterval = setTimeout(() => {
      this.triggerRandomNotification(names, partners, times);
      this.scheduleNextNotification(names, partners, times); // Loop
    }, randomDelay);
  }

  triggerRandomNotification(names: string[], partners: string[], times: string[]) {
    const name = names[Math.floor(Math.random() * names.length)];
    const amount = this.generateUsdAmount(500, 1500);
    const partner = partners[Math.floor(Math.random() * partners.length)];
    const timeAgo = times[Math.floor(Math.random() * times.length)];

    this.activeNotification.set({ name, amount, partner, timeAgo });

    // Auto dismiss after 6 seconds
    if (this.displayTimeout) clearTimeout(this.displayTimeout);
    this.displayTimeout = setTimeout(() => {
      if (this.activeNotification()?.name === name) { // Ensure we don't clear a newer one
        this.dismissNotification();
      }
    }, 6000);
  }

  dismissNotification() {
    this.activeNotification.set(null);
  }

  private generateUsdAmount(min: number, max: number): string {
    const safeMin = Math.max(0, Math.floor(min));
    const safeMax = Math.max(safeMin, Math.floor(max));
    const amount = Math.floor(Math.random() * (safeMax - safeMin + 1)) + safeMin;
    return `$${amount.toLocaleString('en-US')}`;
  }

  ngOnDestroy() {
    if (this.timerInterval) clearTimeout(this.timerInterval);
    if (this.displayTimeout) clearTimeout(this.displayTimeout);
  }
}
