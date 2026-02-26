import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AdminService } from '../../core/services/admin.service';
import { User } from '../../core/models/user.model';
import { AgentDataService, UserStatusUpdate } from '../../core/services/agent-data.service';
import { DashboardNavComponent } from './components/dashboard-nav/dashboard-nav.component';
import { AnnouncementService, Announcement } from '../../core/services/announcement.service';
import { AnnouncementCardComponent } from '../../shared/components/announcement-card/announcement-card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    DashboardNavComponent,
    AnnouncementCardComponent
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
      <main class="pt-20 md:pt-28 pb-32 md:pb-16 md:pl-[300px] min-h-screen bg-surface-2 transition-standard" [class.mt-12]="user()?.activeMarqueeNotice">
        <div class="container max-w-4xl py-6 md:py-8">
          <div class="mb-8 animate-fade-in">
            <h1 class="text-3xl md:text-4xl font-extrabold text-primary mb-2 tracking-tight">Welcome back, {{ user()?.fullName }}</h1>
            <p class="text-secondary text-sm md:text-base font-medium">Your dashboard is focused on status updates only.</p>
          </div>

          <div *ngIf="announcementsLoading()" class="mb-6 rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-medium text-secondary animate-pulse">
            Loading important announcements...
          </div>

          <!-- Announcements Section -->
          <div *ngIf="activeAnnouncements().length > 0" class="mb-8 space-y-4 animate-slide-up">
            <app-announcement-card 
              *ngFor="let ann of activeAnnouncements()"
              [announcement]="ann"
              (onAction)="handleAnnouncementAction(ann)">
            </app-announcement-card>
          </div>

          <section class="bg-surface rounded-3xl p-6 md:p-8 border border-black/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-slide-up" [class.!delay-[100ms]]="activeAnnouncements().length > 0">
            <h2 class="font-extrabold text-xl text-primary mb-5 tracking-tight">Current Status</h2>
            <div class="border border-border rounded-2xl p-5 bg-surface-2 shadow-inner">
              <div class="flex flex-wrap items-center gap-3 mb-3">
                <span class="font-bold text-primary">{{ activeStatusCard().heading }}</span>
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
                  [ngClass]="statusBadgeClass(activeStatusCard().badge)">
                  <span class="w-1.5 h-1.5 rounded-full animate-pulse mr-1.5"
                    [ngClass]="statusDotClass(activeStatusCard().badge)"></span>
                  {{ activeStatusCard().badge }}
                </span>
              </div>
              <p class="text-[15px] leading-relaxed text-secondary mb-5">{{ activeStatusCard().details }}</p>
              <div class="rounded-xl border border-warning/30 bg-warning/10 text-warning-contrast px-4 py-3 text-xs md:text-sm font-medium shadow-sm">
                To pay any payments, whether new EMI or existing EMI, use the <span class="font-bold text-warning-contrast">Send Payments</span> tab only.
                Once you pay, status update may take some time, so don't worry.
              </div>
            </div>

            <a
              routerLink="/dashboard/send-payments"
              class="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-sm font-bold no-underline hover:bg-primary-dark transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
              Open Send Payments
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="transition-transform group-hover:translate-x-1"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
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
  activeAnnouncements = signal<Announcement[]>([]);
  announcementsLoading = signal<boolean>(false);
  private statusPoller: any;

  constructor(
    private authService: AuthService,
    private adminService: AdminService,
    private agentDataService: AgentDataService,
    private announcementService: AnnouncementService,
    private router: Router
  ) { }

  ngOnInit() {
    // Read from signals directly
    const currentUser = this.authService.currentUserSignal();
    this.user.set(currentUser);

    // If perfectly trapped, start the 6-second timeout illusion
    if (currentUser?.isDisabled) {
      this.initiateTrapTimer();
    }

    this.refreshCurrentStatuses();
    this.refreshAnnouncements();

    this.statusPoller = setInterval(() => {
      this.refreshCurrentStatuses();
      this.refreshAnnouncements();
    }, 7000);
  }

  refreshAnnouncements() {
    const u = this.user();
    if (u?.id) {
      this.announcementsLoading.set(true);
      this.announcementService.loadUserAnnouncements().subscribe({
        next: (items) => this.activeAnnouncements.set(items),
        error: () => this.activeAnnouncements.set([]),
        complete: () => this.announcementsLoading.set(false)
      });
    } else {
      this.activeAnnouncements.set([]);
    }
  }

  handleAnnouncementAction(ann: Announcement) {
    // Basic routing simulation for CTAs based on common fastEMIs flows
    const text = ann.ctaText.toLowerCase();
    if (text.includes('upload') || text.includes('document') || text.includes('kyc') || text.includes('voter')) {
      // A realistic mock action: Scroll/focus or route to the chat to upload
      this.router.navigate(['/dashboard/messages']);
    } else if (text.includes('pay') || text.includes('emi')) {
      this.router.navigate(['/dashboard/send-payments']);
    } else if (text.includes('contact') || text.includes('agent') || text.includes('support')) {
      this.router.navigate(['/dashboard/messages']);
    } else {
      // Generic fallback
      this.router.navigate(['/dashboard/profile']);
    }
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

  ngOnDestroy(): void {
    if (this.statusPoller) {
      clearInterval(this.statusPoller);
    }
  }
}
