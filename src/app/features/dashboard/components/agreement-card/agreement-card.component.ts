import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Application, ApplicationStatus } from '../../../../core/models/application.model';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-dashboard-agreement',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  template: `
    <div class="bg-surface rounded-2xl p-6 border border-border shadow-sm mb-6 relative overflow-hidden">
      <!-- Locked Overlay -->
      <div *ngIf="isLocked" class="absolute inset-0 bg-surface/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-center p-6">
        <div class="w-12 h-12 rounded-full bg-surface-3 flex items-center justify-center text-secondary mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        </div>
        <h3 class="font-bold text-primary mb-2">Agreement Locked</h3>
        <p class="text-sm text-secondary">Please wait for document and background verification to complete.</p>
      </div>

      <div class="flex items-start justify-between mb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-primary-light/10 flex items-center justify-center text-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </div>
          <div>
            <h2 class="font-bold text-primary">Mandate & Agreement</h2>
            <p class="text-xs text-secondary">Digital signature required</p>
          </div>
        </div>
        
        <!-- Status Badge -->
        <span *ngIf="!isLocked && !isCompleted" class="text-xs font-bold px-2 py-1 bg-[#FFF3E0] text-warning rounded-full uppercase tracking-wider">Pending</span>
        <span *ngIf="isCompleted" class="text-xs font-bold px-2 py-1 bg-[#E8F5E9] text-success rounded-full uppercase tracking-wider flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> Signed
        </span>
      </div>

      <div *ngIf="!isLocked && !isCompleted" class="bg-surface-2 p-4 rounded-xl border border-border mb-6">
        <p class="text-sm text-secondary mb-4">
          Review the final terms of your EMI plan, set up the e-mandate for automatic EMI deductions, and digitally sign the agreement.
        </p>
        <app-button variant="primary" [fullWidth]="true" (onClick)="onStartAgreement()">
          Review & Sign Agreement
        </app-button>
      </div>
      
      <div *ngIf="isCompleted" class="bg-surface-2 p-4 rounded-xl border border-border">
        <div class="flex items-center gap-3 mb-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-success"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          <span class="text-sm font-medium text-primary">EMI Plan Agreement Document</span>
        </div>
        <div class="flex items-center gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-success"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          <span class="text-sm font-medium text-primary">e-NACH Mandate Authorization</span>
        </div>
      </div>

    </div>
  `
})
export class DashboardAgreementComponent {
  @Input() application: Application | null = null;
  @Input() isLocked: boolean = true;
  @Input() isCompleted: boolean = false;

  @Output() startAgreement = new EventEmitter<void>();

  onStartAgreement() {
    this.startAgreement.emit();
  }
}
