import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { LocationAccessService } from '../../../../core/services/location-access.service';

@Component({
    selector: 'app-location-access',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
    <div class="min-h-screen bg-surface-2 flex items-center justify-center px-4 py-8">
      <section class="w-full max-w-md rounded-3xl border border-border bg-surface shadow-[0_18px_40px_rgba(0,0,0,0.08)] p-6 sm:p-7">
        <p class="text-xs font-bold tracking-widest text-accent uppercase mb-3">Location Access Required</p>
        <h1 class="text-2xl font-extrabold text-primary tracking-tight mb-2">Please allow location permission to access the website.</h1>
        <p class="text-sm text-secondary leading-relaxed mb-5">
          We capture your live location once per login session and show the last login location to the agent for verification.
          Accuracy depends on GPS/Wi-Fi/network availability.
        </p>

        <div class="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-xs text-warning mb-5">
          If permission is denied, dashboard access remains locked until location is allowed.
        </div>

        <button
          type="button"
          (click)="requestLocation()"
          [disabled]="locationAccessService.requesting()"
          class="w-full rounded-xl px-4 py-3 text-sm font-bold text-white bg-primary hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
          {{ locationAccessService.requesting() ? 'Requesting Location...' : 'Allow Location & Continue' }}
        </button>

        <button
          type="button"
          (click)="requestLocation()"
          [disabled]="locationAccessService.requesting()"
          class="w-full mt-3 rounded-xl px-4 py-3 text-sm font-semibold text-primary border border-border bg-surface hover:bg-surface-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
          Retry
        </button>

        <p *ngIf="errorMessage()" class="mt-4 rounded-lg border border-error/30 bg-error/10 text-error text-xs px-3 py-2">
          {{ errorMessage() }}
        </p>

        <a routerLink="/" class="inline-flex mt-5 text-xs font-semibold text-secondary no-underline hover:text-primary">
          Back to home
        </a>
      </section>
    </div>
  `
})
export class LocationAccessComponent implements OnInit {
    readonly errorMessage = signal('');
    private returnUrl = '/dashboard';

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private authService: AuthService,
        public locationAccessService: LocationAccessService
    ) { }

    ngOnInit(): void {
        const currentUser = this.authService.currentUserSignal();
        if (!currentUser || currentUser.role !== 'user') {
            this.router.navigate(['/sign-in']);
            return;
        }

        const requested = String(this.route.snapshot.queryParamMap.get('returnUrl') || '').trim();
        if (requested.startsWith('/dashboard') && !requested.startsWith('/dashboard/location-access')) {
            this.returnUrl = requested;
        }

        if (this.locationAccessService.isLocationSatisfiedForCurrentSession()) {
            this.router.navigateByUrl(this.returnUrl);
            return;
        }

        this.requestLocation();
    }

    requestLocation(): void {
        this.errorMessage.set('');
        this.locationAccessService.captureCurrentLocation().subscribe((result) => {
            if (result.success) {
                this.router.navigateByUrl(this.returnUrl);
                return;
            }
            this.errorMessage.set(result.message || 'Location permission is required to continue.');
        });
    }
}
