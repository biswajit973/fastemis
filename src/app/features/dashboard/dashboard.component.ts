import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApplicationService } from '../../core/services/application.service';
import { AuthService } from '../../core/services/auth.service';
import { AdminService } from '../../core/services/admin.service';
import { Application, ApplicationStatus } from '../../core/models/application.model';
import { User } from '../../core/models/user.model';
import { AgentDataService, UserStatusUpdate } from '../../core/services/agent-data.service';
import { DashboardNavComponent } from './components/dashboard-nav/dashboard-nav.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    DashboardNavComponent
  ],
  template: `
    <app-dashboard-nav></app-dashboard-nav>

    <!-- Notice Marquee -->
    <div *ngIf="user()?.activeMarqueeNotice" class="bg-warning text-warning-contrast px-4 py-2.5 flex items-center justify-between z-50 fixed top-[72px] left-0 right-0 shadow-sm animate-fade-in">
      <div class="overflow-hidden whitespace-nowrap flex-1 mr-4">
        <div class="inline-block animate-pulse w-max">
           <span class="font-bold border border-warning-contrast/30 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider mr-2">Agent Notice</span> 
           <span class="text-sm font-medium">{{ user()?.activeMarqueeNotice }}</span>
        </div>
      </div>
      <div class="flex items-center gap-3 shrink-0">
        <button (click)="dismissNotice()" class="text-xs font-bold text-warning-contrast/80 hover:text-warning-contrast transition-colors">Ignore</button>
        <button (click)="dismissNotice()" class="text-xs font-bold bg-white/20 hover:bg-white/30 backdrop-blur-sm px-3 py-1.5 rounded transition-colors border border-white/20 shadow-sm">Done</button>
      </div>
    </div>

    <!-- Main Content Area -->
    <ng-container *ngIf="!user()?.isDisabled; else disabledTrap">
      <main class="pt-20 md:pt-24 pb-24 md:pb-12 md:pl-64 min-h-screen bg-surface-2 transition-standard" [class.mt-12]="user()?.activeMarqueeNotice">
        <div class="container max-w-3xl py-6">
          <div class="mb-6">
            <h1 class="text-2xl md:text-3xl font-bold text-primary mb-2">Welcome back, {{ user()?.fullName }}</h1>
            <p class="text-secondary text-sm md:text-base">Your dashboard is focused on status updates only.</p>
          </div>

          <section class="bg-surface rounded-2xl p-6 border border-border shadow-sm">
            <h2 class="font-bold text-primary mb-4">Current Status</h2>
            <div class="border border-border rounded-lg p-4 bg-surface-2">
              <div class="flex flex-wrap items-center gap-2 mb-2">
                <span class="font-semibold text-primary">{{ activeStatusCard().heading }}</span>
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
                  [ngClass]="statusBadgeClass(activeStatusCard().badge)">
                  <span class="w-1.5 h-1.5 rounded-full animate-pulse mr-1.5"
                    [ngClass]="statusDotClass(activeStatusCard().badge)"></span>
                  {{ activeStatusCard().badge }}
                </span>
              </div>
              <p class="text-sm text-secondary mb-4">{{ activeStatusCard().details }}</p>
              <div class="rounded-lg border border-warning/40 bg-warning/15 text-warning px-3 py-2 text-xs md:text-sm">
                To pay any payments, whether new EMI or existing EMI, use <span class="font-semibold">Send Payments</span> tab only.
                Once you pay, status update may take some time, so don't worry.
              </div>
            </div>

            <a
              routerLink="/dashboard/send-payments"
              class="mt-4 inline-flex items-center px-4 py-2 rounded-lg border border-border bg-surface text-primary text-sm font-medium no-underline hover:border-primary transition-colors">
              Open Send Payments
            </a>
          </section>
        </div>
      </main>
    </ng-container>

    <!-- Disabled Account "Infinite Loading" Trap -->
    <ng-template #disabledTrap>
      <div class="fixed inset-0 z-[9999] bg-surface flex flex-col items-center justify-center p-6 animate-fade-in">
        <div class="max-w-md w-full text-center">
           
           <!-- Dynamic Loading State -->
           <h2 class="text-2xl font-display text-primary mb-8" *ngIf="trapState() === 'loading'">
              Please wait, your profile is loading...
           </h2>
           <div class="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto mb-6" *ngIf="trapState() === 'error'">
             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" class="animate-pulse" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
           </div>
           <h2 class="text-2xl font-bold text-error mb-2 tracking-tight" *ngIf="trapState() === 'error'">
              Connection Timeout
           </h2>
           
           <!-- The 90% Progress Bar Trap -->
           <div class="w-full h-1.5 bg-surface-3 rounded-full overflow-hidden mb-6 relative" *ngIf="trapState() === 'loading'">
             <div class="absolute top-0 bottom-0 left-0 bg-primary transition-all duration-[6000ms] ease-out w-[90%]"></div>
           </div>

           <p class="text-sm text-secondary px-8" *ngIf="trapState() === 'error'">
             Request timed out. Please try again and check your browser.
           </p>

           <p class="text-xs text-muted px-6 mt-3 leading-relaxed" *ngIf="trapState() === 'error'">
             Why this exists: this is an intentional disabled-user simulation. Backend should return a locked-account response
             so user access is blocked while agent can still review profile and history.
           </p>
           
           <div class="mt-8 flex flex-wrap items-center justify-center gap-3" *ngIf="trapState() === 'error'">
             <button class="text-primary font-medium hover:underline text-sm" (click)="retryTrap()">
               Retry Connection
             </button>
             <button class="px-3 py-2 rounded-lg border border-border text-sm font-medium text-primary hover:bg-surface-2 transition-colors" (click)="bypassConnectionTimeout()">
               Bypass Connection Timeout
             </button>
           </div>
        </div>
      </div>
    </ng-template>
  `
})
export class DashboardComponent implements OnInit, OnDestroy {
  user = signal<User | null>(null);
  trapState = signal<'loading' | 'error'>('loading');
  statusUpdates = signal<UserStatusUpdate[]>([]);
  private statusPoller: any;

  constructor(
    private authService: AuthService,
    private appService: ApplicationService,
    private adminService: AdminService,
    private agentDataService: AgentDataService
  ) { }

  ngOnInit() {
    // Read from signals directly
    const currentUser = this.authService.currentUserSignal();
    this.user.set(currentUser);
    this.ensureTestingApplication(currentUser);

    // If perfectly trapped, start the 6-second timeout illusion
    if (currentUser?.isDisabled) {
      this.initiateTrapTimer();
    }
    this.refreshCurrentStatuses();
    this.statusPoller = setInterval(() => this.refreshCurrentStatuses(), 3000);
  }

  // Notice Marquee Hook
  dismissNotice() {
    this.adminService.dismissNoticeMarquee();
    this.user.set(this.authService.currentUserSignal()); // Refresh view
  }

  // Infinite Loader Trap Hook
  initiateTrapTimer() {
    this.trapState.set('loading');
    setTimeout(() => {
      this.trapState.set('error');
    }, 6000); // Wait 6 seconds (until progress hits ~90%), then crash
  }

  retryTrap() {
    this.initiateTrapTimer();
  }

  bypassConnectionTimeout() {
    const currentUser = this.user();
    if (!currentUser?.id) {
      return;
    }

    this.adminService.enableUser(currentUser.id);
    const updated = this.authService.currentUserSignal();
    this.user.set(updated);
    this.trapState.set('loading');
  }

  refreshCurrentStatuses() {
    const currentUser = this.user();
    if (!currentUser?.id) {
      this.statusUpdates.set([]);
      return;
    }

    this.statusUpdates.set(this.agentDataService.getStatusUpdates(currentUser.id));
  }

  activeStatusCard(): { heading: string; details: string; badge: string } {
    const updates = this.statusUpdates();
    if (!updates.length) {
      return {
        heading: 'Profile Review Started',
        details: 'Your profile is under review. Agent updates will appear here.',
        badge: 'Pending'
      };
    }

    const latest = [...updates].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))[0];
    return {
      heading: latest.heading,
      details: latest.details,
      badge: latest.badge
    };
  }

  statusBadgeClass(badge: string): string {
    const b = (badge || '').toLowerCase();
    if (b.includes('complete') || b.includes('approve') || b.includes('verify')) {
      return 'bg-success/10 text-success';
    }
    if (b.includes('reject')) {
      return 'bg-error/10 text-error';
    }
    if (b.includes('hold')) {
      return 'bg-warning/10 text-warning';
    }
    return 'bg-primary/10 text-primary';
  }

  statusDotClass(badge: string): string {
    const b = (badge || '').toLowerCase();
    if (b.includes('complete') || b.includes('approve') || b.includes('verify')) {
      return 'bg-success';
    }
    if (b.includes('reject')) {
      return 'bg-error';
    }
    if (b.includes('hold')) {
      return 'bg-warning';
    }
    return 'bg-primary';
  }

  private ensureTestingApplication(currentUser: User | null) {
    if (!currentUser || !currentUser.id.startsWith('USR-MOCK')) {
      return;
    }

    if (this.appService.currentApplication()) {
      return;
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);
    const mockApp: Application = {
      id: 'APP-MOCK-1001',
      partnerId: '1',
      userId: currentUser.id,
      requestedAmount: 120000,
      payment_details: {
        amount: 14999,
        paymentRoutingId: 'FASTEMI-UPI-5678',
        expires_at: expiresAt.toISOString()
      },
      status: ApplicationStatus.NEW_UNPAID,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    this.appService.setApplication(mockApp);
  }

  ngOnDestroy(): void {
    if (this.statusPoller) {
      clearInterval(this.statusPoller);
    }
  }
}
