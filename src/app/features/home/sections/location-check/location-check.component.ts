import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Partner } from '../../../../core/models/partner.model';
import { LocationService } from '../../../../core/services/location.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { Router } from '@angular/router';

@Component({
    selector: 'app-location-check',
    standalone: true,
    imports: [CommonModule, ButtonComponent],
    template: `
    <div *ngIf="isOpen()" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-[#0A2540] opacity-85 transition-opacity" (click)="closeIfAllowed()"></div>
      
      <!-- Modal Content -->
      <div class="bg-surface w-full max-w-[420px] rounded-2xl shadow-lg relative z-10 p-8 flex flex-col items-center text-center transform scale-in">
        
        <ng-container *ngIf="phase() === 'checking'">
          <div class="w-16 h-16 rounded-full bg-surface-3 flex items-center justify-center mb-6 relative">
            <div class="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span class="text-2xl">{{ checkingIcon() }}</span>
          </div>
          
          <h3 class="text-xl font-bold text-primary mb-2">Verifying Location</h3>
          <p class="text-secondary text-sm h-10">{{ checkingText() }}</p>

          <!-- Progress Bar -->
          <div class="w-full bg-surface-3 h-2 rounded-full overflow-hidden mt-6">
            <div class="h-full bg-primary transition-all duration-700 ease-out" [style.width]="progress() + '%'"></div>
          </div>
        </ng-container>

        <ng-container *ngIf="phase() === 'available'">
          <div class="w-16 h-16 rounded-full bg-accent-soft flex items-center justify-center mb-6 text-success scale-in">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <h3 class="text-xl font-bold text-primary mb-2">CoinVault Service Available</h3>
          <p class="text-secondary text-sm mb-5">
            <span class="font-bold">{{ partner?.name }}</span> is serviceable in your region.
            Please choose how you want to continue.
          </p>

          <div class="w-full space-y-3">
            <app-button variant="primary" [fullWidth]="true" (onClick)="proceedAsExistingUser()">
              Existing User Login
            </app-button>
            <app-button variant="outline" [fullWidth]="true" (onClick)="proceedAsNewUser()">
              New User Sign Up
            </app-button>
          </div>
        </ng-container>

        <ng-container *ngIf="phase() === 'unavailable'">
          <div class="w-16 h-16 rounded-full bg-[#FFEBEE] flex items-center justify-center mb-6 text-error scale-in">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </div>
          <h3 class="text-xl font-bold text-primary mb-2">Non Serviceable in Your Region</h3>
          <p class="text-secondary text-sm mb-6">
            {{ partner?.name }} is not serviceable in your region right now. Please check other vendors.
          </p>

          <app-button variant="outline" [fullWidth]="true" (onClick)="close()">
            Check Other Vendors
          </app-button>
        </ng-container>

      </div>
    </div>
  `
})
export class LocationCheckComponent {
    @Input() partner: Partner | null = null;
    @Output() closed = new EventEmitter<void>();

    isOpen = signal<boolean>(false);
    phase = signal<'checking' | 'available' | 'unavailable'>('checking');

    checkingIcon = signal<string>('📍');
    checkingText = signal<string>('Detecting your location...');
    progress = signal<number>(0);

    private intervals: number[] = [];
    private timeouts: number[] = [];

    constructor(private locationService: LocationService, private router: Router) { }

    public open(partner: Partner) {
        this.partner = partner;
        this.phase.set('checking');
        this.progress.set(0);
        this.isOpen.set(true);

        this.runAnimationSequence();

        // Simulate API Check
        this.locationService.checkPartnerAvailability(partner.id).subscribe(status => {
            // Resolve after animation sequence finishes (~2800ms total)
            const t = window.setTimeout(() => {
                this.phase.set(status);
            }, 2900);
            this.timeouts.push(t);
        });
    }

    runAnimationSequence() {
        const steps = [
            { t: 0, p: 25, i: '📍', txt: 'Detecting your location...' },
            { t: 700, p: 50, i: '🔍', txt: 'Checking service availability...' },
            { t: 1400, p: 75, i: '🛡️', txt: 'Verifying regional eligibility...' },
            { t: 2100, p: 98, i: '📋', txt: 'Reviewing partner access...' }
        ];

        steps.forEach(step => {
            const t = window.setTimeout(() => {
                if (!this.isOpen() || this.phase() !== 'checking') return;
                this.progress.set(step.p);
                this.checkingIcon.set(step.i);
                this.checkingText.set(step.txt);
            }, step.t);
            this.timeouts.push(t);
        });
    }

    closeIfAllowed() {
        if (this.phase() !== 'checking') {
            this.close();
        }
    }

    close() {
        this.isOpen.set(false);
        this.partner = null;
        this.clearTimers();
        this.closed.emit();
    }

    clearTimers() {
        this.timeouts.forEach(t => clearTimeout(t));
        this.intervals.forEach(i => clearInterval(i));
        this.timeouts = [];
        this.intervals = [];
    }

    proceedAsExistingUser() {
        this.clearTimers();
        this.close();
        this.router.navigate(['/sign-in'], { queryParams: { role: 'user', source: 'coinvault' } });
    }

    proceedAsNewUser() {
        this.clearTimers();
        this.close();
        this.router.navigate(['/partner', 'coinvault-finance', 'apply']);
    }
}
