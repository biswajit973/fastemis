import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApplicationStatus } from '../../../../core/models/application.model';

@Component({
  selector: 'app-dashboard-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-surface rounded-2xl p-6 border border-border shadow-sm mb-6">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h2 class="font-bold text-primary text-lg">Application Status</h2>
          <p class="text-sm text-secondary">ID: {{ applicationId }}</p>
        </div>
        <div class="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider"
             [ngClass]="{
               'bg-[#FFF3E0] text-warning': status === 'kyc_paid' || status === 'agreement_pending' || status === 'bgv_in_progress',
               'bg-accent-soft text-accent': status === 'agreement_done',
               'bg-[#E8F5E9] text-success': status === 'completed',
               'bg-error/10 text-error': status === 'rejected',
               'bg-primary-light/10 text-primary': status === 'new_unpaid'
             }">
          {{ getStatusLabel(status) }}
        </div>
      </div>

      <!-- Vertical Timeline -->
      <div class="relative pl-3 space-y-6">
        <!-- Timeline Line -->
        <div class="absolute w-[2px] bg-border left-4 top-2 bottom-2 z-0"></div>

        <div *ngFor="let step of timelineSteps; let i = index" 
             class="flex gap-4 relative z-10 opacity-50"
             [style.opacity]="step.isPast || step.isCurrent ? '1' : '0.5'">
          
          <!-- Node -->
          <div class="mt-1">
            <div class="w-6 h-6 rounded-full flex items-center justify-center border-2 bg-surface transition-standard"
                 [ngClass]="{
                   'border-success text-success': step.isPast,
                   'border-primary border-4 shadow-sm': step.isCurrent,
                   'border-border text-border-strong': !step.isPast && !step.isCurrent
                 }">
              <svg *ngIf="step.isPast" width="12" height="12" viewBox="0 0 24 24" fill="none" class="text-success" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <div *ngIf="step.isCurrent" class="w-2 h-2 rounded-full bg-primary"></div>
            </div>
          </div>

          <!-- Content -->
          <div class="flex-1 pb-2">
            <h4 class="font-bold text-primary mb-1" [ngClass]="{'text-primary': step.isCurrent || step.isPast, 'text-secondary': !step.isCurrent && !step.isPast}">
              {{ step.title }}
            </h4>
            <p class="text-sm text-secondary">{{ step.description }}</p>
            
            <div *ngIf="step.isCurrent && i === 1" class="mt-3 text-xs text-primary font-medium flex items-center gap-2 bg-surface-2 p-2 rounded-md border border-border">
              <span class="animate-pulse w-2 h-2 rounded-full bg-warning block"></span>
              Verification in progress. Usually takes 3-12 hours.
            </div>
            
          </div>
        </div>

      </div>
    </div>
  `
})
export class DashboardStatusComponent {
  @Input() status: ApplicationStatus = ApplicationStatus.NEW_UNPAID;
  @Input() applicationId: string = '';

  get timelineSteps() {
    const STATUS_WEIGHT: Record<ApplicationStatus, number> = {
      [ApplicationStatus.NEW_UNPAID]: 0,
      [ApplicationStatus.KYC_PAID]: 1,
      [ApplicationStatus.AGREEMENT_PENDING]: 2,
      [ApplicationStatus.AGREEMENT_DONE]: 3,
      [ApplicationStatus.BGV_IN_PROGRESS]: 4,
      [ApplicationStatus.COMPLETED]: 5,
      [ApplicationStatus.REJECTED]: 4, // Shows red state
    };

    const w = STATUS_WEIGHT[this.status] || 0;

    return [
      {
        title: 'New Request & Unpaid',
        description: 'Your application has been received.',
        isPast: w > 0,
        isCurrent: w === 0
      },
      {
        title: 'KYC & Processing Fee',
        description: 'Processing initial documents and fees.',
        isPast: w > 1,
        isCurrent: w === 1
      },
      {
        title: 'Mandate & Agreement',
        description: 'Sign the NACH mandate and digital EMI plan agreement.',
        isPast: w > 2,
        isCurrent: w === 2
      },
      {
        title: 'Agreement Completed',
        description: 'Documents successfully digitally signed.',
        isPast: w > 3,
        isCurrent: w === 3
      },
      {
        title: 'Background Verification',
        description: 'Our team is reviewing your profile (BGV).',
        isPast: w > 4,
        isCurrent: w === 4
      },
      {
        title: 'Approved & Completed',
        description: 'Application successfully verified.',
        isPast: w === 5,
        isCurrent: w === 5
      }
    ];
  }

  getStatusLabel(status: ApplicationStatus): string {
    return status.replace(/_/g, ' ');
  }
}
