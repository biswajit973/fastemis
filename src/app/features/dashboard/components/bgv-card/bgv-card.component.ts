import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-dashboard-bgv',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="bg-surface rounded-2xl p-6 border border-border shadow-sm mb-6 relative overflow-hidden">
      
      <div class="flex items-start justify-between mb-6">
        <div class="flex flex-col md:flex-row md:items-center gap-4">
          <div class="w-12 h-12 rounded-full bg-surface-3 flex items-center justify-center text-primary relative">
            <svg *ngIf="status === 'pending'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <svg *ngIf="status === 'verified'" width="24" height="24" viewBox="0 0 24 24" fill="none" class="text-success" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <svg *ngIf="status === 'failed'" width="24" height="24" viewBox="0 0 24 24" fill="none" class="text-error" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
            <div *ngIf="status === 'pending'" class="absolute -right-1 -bottom-1 w-4 h-4 rounded-full bg-warning border-2 border-surface flex items-center justify-center animate-pulse"></div>
          </div>
          <div>
            <h2 class="font-bold text-primary text-lg">Background Verification (BGV)</h2>
            <p class="text-sm text-secondary">
              <span *ngIf="status === 'pending'">Our team is currently verifying your details.</span>
              <span *ngIf="status === 'verified'" class="text-success font-medium">Verification completed successfully.</span>
              <span *ngIf="status === 'failed'" class="text-error font-medium">Verification failed. Check messages for details.</span>
            </p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <!-- Document Check -->
        <div class="bg-surface-2 p-4 rounded-xl border border-border flex items-center justify-between">
          <div class="text-sm font-medium text-primary">Identity & KYC</div>
          <div *ngIf="status === 'pending' || status === 'verified'" class="text-success">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
        </div>
        
        <!-- Financial Check -->
        <div class="bg-surface-2 p-4 rounded-xl border border-border flex items-center justify-between">
          <div class="text-sm font-medium text-primary">Financial Health</div>
          <div *ngIf="status === 'pending'" class="text-warning">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin"><path d="M21.5 2v6h-6M2.13 15.57a10 10 0 1 0 1.25-10.74M21.2 5l-1.63-2.67M3 9v-6h6M2.8 19l1.63 2.67M2.8 5L1.17 2.33M21.2 19l1.63 2.67M12 21.5c-5.25 0-9.5-4.25-9.5-9.5"></path></svg>
          </div>
          <div *ngIf="status === 'verified'" class="text-success">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
        </div>

        <!-- Risk Check -->
        <div class="bg-surface-2 p-4 rounded-xl border border-border flex items-center justify-between">
          <div class="text-sm font-medium text-primary">Risk Assessment</div>
          <div *ngIf="status === 'pending'" class="text-border-strong">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
          <div *ngIf="status === 'verified'" class="text-success">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
        </div>
      </div>

    </div>
  `
})
export class DashboardBgvComponent implements OnInit {
    @Input() status: 'pending' | 'verified' | 'failed' = 'pending';
    @Output() simulatedCompletion = new EventEmitter<void>();

    ngOnInit() {
        // For prototype purposes, auto-complete BGV after 15 seconds if it's pending
        if (this.status === 'pending') {
            setTimeout(() => {
                this.simulatedCompletion.emit();
            }, 15000);
        }
    }
}
