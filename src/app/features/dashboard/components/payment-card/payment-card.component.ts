import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Application } from '../../../../core/models/application.model';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { CountdownTimerComponent } from '../../../../shared/components/countdown-timer/countdown-timer.component';
import { UploadZoneComponent } from '../../../../shared/components/upload-zone/upload-zone.component';
import { CurrencyGlobalPipe } from '../../../../shared/pipes/custom.pipes';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard-payment',
  standalone: true,
  imports: [CommonModule, ButtonComponent, InputComponent, CountdownTimerComponent, UploadZoneComponent, CurrencyGlobalPipe, FormsModule],
  template: `
    <div class="bg-surface rounded-2xl p-6 border border-border shadow-sm mb-6 relative overflow-hidden">
      <!-- Locked Overlay -->
      <div *ngIf="isLocked" class="absolute inset-0 bg-surface/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-center p-6">
        <div class="w-12 h-12 rounded-full bg-surface-3 flex items-center justify-center text-secondary mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        </div>
        <h3 class="font-bold text-primary mb-2">Advance EMI Payment Locked</h3>
        <p class="text-sm text-secondary">Complete the Mandate & Agreement step first to unlock payment.</p>
      </div>

      <div class="flex items-start justify-between mb-6">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-primary-light/10 flex items-center justify-center text-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          </div>
          <div>
            <h2 class="font-bold text-primary">Advance EMI Payment</h2>
            <p class="text-xs text-secondary">First installment required for disbursal</p>
          </div>
        </div>
        
        <!-- Timer -->
        <div *ngIf="!isLocked && application?.payment_details?.expires_at" class="bg-surface-3 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2">
          <span class="text-secondary text-xs font-medium">Expires in</span>
          <app-countdown-timer 
            [targetDate]="application!.payment_details!.expires_at"
            (expired)="onTimerExpired()">
          </app-countdown-timer>
        </div>
      </div>

      <div class="bg-surface-2 p-4 rounded-xl border border-border mb-6 flex justify-between items-center">
        <div>
          <span class="text-sm text-muted block mb-1">Amount Due</span>
          <span class="font-mono text-2xl font-bold text-primary">{{ application?.payment_details?.amount | currencyGlobal }}</span>
        </div>
        <div class="text-right">
          <span class="text-sm text-muted block mb-1">Pay To</span>
          <span class="font-medium text-primary text-sm">{{ application?.payment_details?.paymentRoutingId }}</span>
        </div>
      </div>

      <div *ngIf="!isLocked && !isExpired()" class="space-y-6">
        <div class="flex items-center gap-4">
          <div class="flex-1 h-px bg-border"></div>
          <span class="text-xs font-medium text-muted uppercase tracking-wider">Payment Proof</span>
          <div class="flex-1 h-px bg-border"></div>
        </div>

        <div>
          <label class="block text-sm font-medium text-secondary mb-2">Upload Transaction Screenshot</label>
          <app-upload-zone 
            label="Upload Payment Screenshot"
            hint="JPG or PNG format"
            accept="image/*"
            [uploading]="uploading()"
            [progress]="progress()"
            (fileDropped)="onFileDropped($event)">
          </app-upload-zone>
        </div>

        <div>
          <app-input 
            id="utr" [(ngModel)]="utrNumber" label="Transaction / Reference Number" 
            placeholder="Enter 12-digit transaction number" [monospace]="true">
          </app-input>
        </div>

        <app-button 
          variant="primary" 
          [fullWidth]="true" 
          [disabled]="!selectedFile() || utrNumber.length < 6"
          (onClick)="submitPayment()">
          Submit Payment Proof
        </app-button>
      </div>

      <div *ngIf="isExpired()" class="text-center p-6 bg-[#FFEBEE] rounded-xl border border-error/20">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" class="text-error mx-auto mb-3" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 15 15"></polyline></svg>
        <h4 class="font-bold text-primary mb-1">Payment Window Expired</h4>
        <p class="text-sm text-secondary mb-4">The allocated time to make the advance EMI payment has expired. Please request a new payment link.</p>
        <app-button variant="outline" [fullWidth]="false" class="mx-auto block">Request New Link</app-button>
      </div>

    </div>
  `
})
export class DashboardPaymentComponent {
  @Input() application: Application | null = null;
  @Input() isLocked: boolean = true;
  @Output() paymentSubmitted = new EventEmitter<{ file: File, utr: string }>();

  isExpired = signal<boolean>(false);
  uploading = signal<boolean>(false);
  progress = signal<number>(0);
  selectedFile = signal<File | null>(null);

  utrNumber: string = '';

  onTimerExpired() {
    this.isExpired.set(true);
  }

  onFileDropped(file: File) {
    this.uploading.set(true);
    this.progress.set(0);
    this.selectedFile.set(null);

    // Fake upload
    const interval = setInterval(() => {
      this.progress.update(v => {
        if (v >= 100) {
          clearInterval(interval);
          this.uploading.set(false);
          this.selectedFile.set(file);
          return 100;
        }
        return v + 30;
      });
    }, 200);
  }

  submitPayment() {
    if (this.selectedFile() && this.utrNumber) {
      this.paymentSubmitted.emit({
        file: this.selectedFile()!,
        utr: this.utrNumber
      });
    }
  }
}
