import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { AgentApplicationSummary, AgentDataService, AgentUserProfile } from '../../core/services/agent-data.service';
import { ApplicationStatus } from '../../core/models/application.model';

@Component({
  selector: 'app-agent-dashboard',
  standalone: true,
  imports: [CommonModule, BadgeComponent, RouterLink],
  template: `
    <div class="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div class="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-display font-bold text-primary mb-1">Applicants Queue</h1>
          <p class="text-secondary">Use Applicant column for Profile Details and Actions column for quick decisions.</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-surface rounded-xl p-5 border border-border shadow-sm">
          <div class="text-secondary text-sm font-medium mb-1">New Requests</div>
          <div class="text-3xl font-bold text-primary">{{ countByStatus(ApplicationStatus.NEW_UNPAID) }}</div>
        </div>
        <div class="bg-surface rounded-xl p-5 border border-border shadow-sm">
          <div class="text-secondary text-sm font-medium mb-1">In Progress</div>
          <div class="text-3xl font-bold text-warning">{{ countByStatus(ApplicationStatus.BGV_IN_PROGRESS) + countByStatus(ApplicationStatus.KYC_PAID) + countByStatus(ApplicationStatus.AGREEMENT_PENDING) + countByStatus(ApplicationStatus.AGREEMENT_DONE) }}</div>
        </div>
        <div class="bg-surface rounded-xl p-5 border border-border shadow-sm">
          <div class="text-secondary text-sm font-medium mb-1">Completed</div>
          <div class="text-3xl font-bold text-success">{{ countByStatus(ApplicationStatus.COMPLETED) }}</div>
        </div>
        <div class="bg-surface rounded-xl p-5 border border-border shadow-sm">
          <div class="text-secondary text-sm font-medium mb-1">Rejected</div>
          <div class="text-3xl font-bold text-error">{{ countByStatus(ApplicationStatus.REJECTED) }}</div>
        </div>
      </div>

      <div class="bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col mb-8">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm whitespace-nowrap">
            <thead class="bg-surface-2 text-secondary font-medium border-b border-border">
              <tr>
                <th class="px-6 py-4">Application ID</th>
                <th class="px-6 py-4">Applicant</th>
                <th class="px-6 py-4">Amount</th>
                <th class="px-6 py-4">Status</th>
                <th class="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr *ngFor="let app of applications()" class="hover:bg-surface-2/50 transition-colors">
                <td class="px-6 py-4 font-mono text-primary font-medium">{{ app.applicationId }}</td>
                <td class="px-6 py-4">
                  <div class="font-medium text-primary">{{ getUser(app.userId)?.fullName || 'Deleted User' }}</div>
                  <div class="text-xs text-muted mb-2">{{ getUser(app.userId)?.mobile || '-' }} • Last login: {{ formatDateTime(getUser(app.userId)?.lastLoginAt) }}</div>
                  <a [routerLink]="['/agent/applications', app.applicationId]" class="inline-flex items-center px-3 py-1.5 rounded border border-border bg-surface text-primary text-xs font-medium no-underline hover:border-primary hover:text-primary-light transition-colors">
                    Profile Details
                  </a>
                </td>
                <td class="px-6 py-4 font-mono font-medium">{{ formatInr(app.requestedAmount) }}</td>
                <td class="px-6 py-4">
                  <app-badge [variant]="statusVariant(app.status)">{{ statusLabel(app.status) }}</app-badge>
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="inline-flex items-center gap-2">
                    <button (click)="quickAction(app.applicationId, 'approve')" class="px-3 py-1.5 rounded text-xs font-medium border border-success text-success hover:bg-success/10 transition-colors">Approve</button>
                    <button (click)="quickAction(app.applicationId, 'reject')" class="px-3 py-1.5 rounded text-xs font-medium border border-error text-error hover:bg-error/10 transition-colors">Reject</button>
                    <button (click)="quickAction(app.applicationId, 'hold')" class="px-3 py-1.5 rounded text-xs font-medium border border-warning text-warning hover:bg-warning/10 transition-colors">Hold</button>
                  </div>
                </td>
              </tr>

              <tr *ngIf="applications().length === 0">
                <td colspan="5" class="px-6 py-8 text-center text-secondary">No applications available.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class AgentDashboardComponent {
  ApplicationStatus = ApplicationStatus;

  constructor(private agentData: AgentDataService) { }

  applications(): AgentApplicationSummary[] {
    return this.agentData.getApplications();
  }

  getUser(userId: string): AgentUserProfile | null {
    return this.agentData.getUserById(userId);
  }

  countByStatus(status: ApplicationStatus): number {
    return this.applications().filter(app => app.status === status).length;
  }

  quickAction(applicationId: string, action: 'approve' | 'reject' | 'hold') {
    this.agentData.quickAction(applicationId, action);
  }

  statusLabel(status: ApplicationStatus): string {
    if (status === ApplicationStatus.NEW_UNPAID) return 'New Request / Unpaid';
    if (status === ApplicationStatus.KYC_PAID) return 'KYC Done / Paid';
    if (status === ApplicationStatus.AGREEMENT_PENDING) return 'Agreement Pending';
    if (status === ApplicationStatus.AGREEMENT_DONE) return 'Agreement Done';
    if (status === ApplicationStatus.BGV_IN_PROGRESS) return 'BGV In Progress';
    if (status === ApplicationStatus.COMPLETED) return 'Approved BGV / Completed';
    return 'Rejected';
  }

  statusVariant(status: ApplicationStatus): 'success' | 'warning' | 'error' | 'neutral' | 'primary' {
    if (status === ApplicationStatus.COMPLETED) return 'success';
    if (status === ApplicationStatus.REJECTED) return 'error';
    if (status === ApplicationStatus.BGV_IN_PROGRESS || status === ApplicationStatus.KYC_PAID || status === ApplicationStatus.AGREEMENT_PENDING || status === ApplicationStatus.AGREEMENT_DONE) {
      return 'warning';
    }
    return 'primary';
  }

  formatInr(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  }

  formatDateTime(value?: string): string {
    if (!value) return '-';
    return new Date(value).toLocaleString([], {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
