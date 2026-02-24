import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { AgentApplicationSummary, AgentDataService, AgentUploadedMedia, AgentUserProfile, UserStatusUpdate } from '../../core/services/agent-data.service';
import { ApplicationStatus } from '../../core/models/application.model';

@Component({
  selector: 'app-agent-application-details',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, BadgeComponent],
  template: `
    <div class="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-10" *ngIf="application() && user(); else notFound">
      <div class="mb-6">
        <a routerLink="/agent" class="inline-flex items-center gap-2 text-sm font-medium text-secondary hover:text-primary transition-colors no-underline mb-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back to Queue
        </a>

        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 class="text-2xl md:text-3xl font-display font-bold text-primary mb-1 inline-flex items-center gap-3">
              {{ application()!.applicationId }}
              <app-badge [variant]="statusVariant(application()!.status)">{{ statusLabel(application()!.status) }}</app-badge>
            </h1>
            <p class="text-secondary text-sm">Last login: {{ formatDateTime(user()!.lastLoginAt) }}</p>
          </div>

          <a [routerLink]="['/agent/chats', user()!.id]" class="inline-flex items-center px-4 py-2 rounded-lg border border-border bg-surface text-primary text-sm font-medium no-underline hover:border-primary hover:text-primary-light transition-colors">
            Open Full Chat
          </a>
        </div>
      </div>

      <div class="mb-4 flex gap-2">
        <button (click)="activeTab.set('profile')" class="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
          [ngClass]="activeTab() === 'profile' ? 'bg-primary text-white border-primary' : 'bg-surface border-border text-secondary hover:text-primary'">
          Profile Details
        </button>
        <button (click)="activeTab.set('management')" class="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
          [ngClass]="activeTab() === 'management' ? 'bg-primary text-white border-primary' : 'bg-surface border-border text-secondary hover:text-primary'">
          Management
        </button>
      </div>

      <section *ngIf="activeTab() === 'profile'" class="space-y-6">
        <div class="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
          <div class="px-5 py-3 border-b border-border bg-surface-2 font-semibold text-primary">Basic Details (Signup Data)</div>
          <div class="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div><span class="block text-secondary mb-1">Full Name</span><span class="font-medium text-primary">{{ user()!.fullName }}</span></div>
            <div><span class="block text-secondary mb-1">Date of Birth</span><span class="font-medium text-primary">{{ user()!.dob }}</span></div>
            <div><span class="block text-secondary mb-1">Mobile Number</span><span class="font-medium text-primary">{{ user()!.mobile }}</span></div>
            <div><span class="block text-secondary mb-1">Email</span><span class="font-medium text-primary">{{ user()!.email }}</span></div>
            <div><span class="block text-secondary mb-1">Tax ID</span><span class="font-medium text-primary font-mono">{{ user()!.taxId }}</span></div>
            <div><span class="block text-secondary mb-1">National ID</span><span class="font-medium text-primary font-mono">{{ user()!.nationalId }}</span></div>
            <div><span class="block text-secondary mb-1">Employment Type</span><span class="font-medium text-primary">{{ user()!.employmentType | titlecase }}</span></div>
            <div><span class="block text-secondary mb-1">Marital Status</span><span class="font-medium text-primary">{{ user()!.maritalStatus | titlecase }}</span></div>
            <div *ngIf="user()!.maritalStatus === 'married'" class="sm:col-span-2"><span class="block text-secondary mb-1">Better Half Occupation</span><span class="font-medium text-primary">{{ user()!.spouseOccupation || '-' }}</span></div>
            <div><span class="block text-secondary mb-1">Occupation</span><span class="font-medium text-primary">{{ user()!.occupation }}</span></div>
            <div class="sm:col-span-2"><span class="block text-secondary mb-1">Address</span><span class="font-medium text-primary">{{ user()!.address }}</span></div>
          </div>
        </div>

        <div class="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
          <div class="px-5 py-3 border-b border-border bg-surface-2 font-semibold text-primary">Uploaded Media</div>
          <div class="p-4 flex gap-3 overflow-x-auto hide-scrollbar">
            <div *ngFor="let media of user()!.uploadedMedia" class="w-60 shrink-0 border border-border rounded-lg overflow-hidden bg-surface-2">
              <img *ngIf="media.type === 'image' && media.url" [src]="media.url" class="w-full h-36 object-cover">
              <video *ngIf="media.type === 'video' && media.url" [src]="media.url" controls class="w-full h-36 object-cover bg-black"></video>
              <div *ngIf="media.type === 'attachment'" class="h-36 flex flex-col items-center justify-center text-secondary px-4 text-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                <span class="text-xs mt-2 break-all">{{ media.name }}</span>
              </div>
              <div class="p-2 border-t border-border text-[11px] text-secondary">
                <div class="font-medium text-primary truncate">{{ media.name }}</div>
                <div>{{ media.uploadedBy | titlecase }} • {{ formatDateTime(media.uploadedAt) }}</div>
              </div>
            </div>
            <div *ngIf="user()!.uploadedMedia.length === 0" class="text-secondary text-sm py-6">No uploaded media found.</div>
          </div>
        </div>
      </section>

      <section *ngIf="activeTab() === 'management'" class="space-y-6">
        <div class="bg-surface border border-border rounded-xl shadow-sm p-5">
          <div class="flex flex-wrap gap-2 mb-4">
            <button *ngIf="canAdvanceStatus()" (click)="advanceStatus()" class="px-4 py-2 bg-primary text-white hover:bg-primary-light rounded-lg text-sm font-medium transition-colors">Advance Status</button>
            <button *ngIf="application()!.status === ApplicationStatus.BGV_IN_PROGRESS" (click)="approveBGV()" class="px-4 py-2 bg-success text-white hover:bg-success/90 rounded-lg text-sm font-medium transition-colors">Approve BGV</button>
            <button *ngIf="application()!.status === ApplicationStatus.BGV_IN_PROGRESS" (click)="rejectBGV()" class="px-4 py-2 border border-error text-error hover:bg-error/5 rounded-lg text-sm font-medium transition-colors">Reject BGV</button>
            <button (click)="holdApplication()" class="px-4 py-2 border border-warning text-warning hover:bg-warning/5 rounded-lg text-sm font-medium transition-colors">Hold</button>
          </div>

          <div *ngIf="application()!.status === ApplicationStatus.REJECTED && application()!.rejectReason" class="text-sm bg-error/10 border border-error/30 rounded-lg p-3 text-error">
            <div class="font-semibold mb-1">Rejected Reason</div>
            <div>{{ application()!.rejectReason }}</div>
          </div>
        </div>

        <div class="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
          <div class="px-5 py-3 border-b border-border bg-surface-2 font-semibold text-primary">Current Status Management (Max 2)</div>
          <div class="p-5 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input [(ngModel)]="newStatusHeading" type="text" placeholder="Status Heading" class="rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-primary">
              <input [(ngModel)]="newStatusDetails" type="text" placeholder="Status Details" class="rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-primary md:col-span-1">
              <input [(ngModel)]="newStatusBadge" type="text" placeholder="Badge (Completed/Pending/Hold/Rejected)" class="rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-primary">
            </div>
            <button (click)="addStatusUpdate()" [disabled]="statusUpdates().length >= 2" class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              [ngClass]="statusUpdates().length >= 2 ? 'bg-surface-3 text-muted cursor-not-allowed' : 'bg-primary text-white hover:bg-primary-light'">
              Add Status
            </button>
            <p class="text-xs text-secondary">Active statuses: {{ statusUpdates().length }}/2</p>

            <div class="space-y-3">
              <div *ngFor="let st of statusUpdates()" class="p-3 border border-border rounded-lg bg-surface-2 flex items-start justify-between gap-3">
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-semibold text-primary">{{ st.heading }}</span>
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-primary/10 text-primary">
                      <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse mr-1.5"></span>
                      {{ st.badge }}
                    </span>
                  </div>
                  <p class="text-sm text-secondary">{{ st.details }}</p>
                </div>
                <button (click)="removeStatusUpdate(st.id)" class="text-xs px-3 py-1.5 rounded border border-border text-secondary hover:text-error hover:border-error transition-colors">Remove</button>
              </div>
              <div *ngIf="statusUpdates().length === 0" class="text-sm text-secondary">No current statuses added.</div>
            </div>
          </div>
        </div>

        <div class="bg-surface border border-border rounded-xl shadow-sm overflow-hidden p-5 space-y-3">
          <div class="font-medium text-primary">Notice Marquee</div>
          <p class="text-xs text-secondary">Only one active notice is allowed per user.</p>

          <div *ngIf="user()!.notice" class="text-sm bg-warning/10 border border-warning/30 rounded-lg p-3 text-warning">
            <div class="font-semibold mb-1">Active Notice</div>
            <div>{{ user()!.notice }}</div>
          </div>

          <div class="flex gap-2">
            <input [(ngModel)]="noticeInput" [disabled]="!!user()!.notice" type="text" class="flex-1 rounded-lg bg-surface-2 border border-border text-sm px-3 py-2 focus:outline-none focus:border-primary" placeholder="Please upload your Voter ID within 24 hours.">
            <button (click)="sendNotice()" [disabled]="!!user()!.notice || !noticeInput.trim()" class="bg-primary hover:bg-primary-light text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">Send</button>
            <button *ngIf="user()!.notice" (click)="clearNotice()" class="bg-surface-2 border border-border text-secondary hover:text-primary px-4 py-2 rounded-lg text-sm font-medium transition-colors">Clear</button>
          </div>
        </div>

        <div class="bg-surface border border-error/30 rounded-xl shadow-sm overflow-hidden p-5">
          <div class="font-bold text-error uppercase tracking-wider text-xs mb-2">User Management</div>
          <p class="text-xs text-secondary mb-4">Disable preserves data for agent review. Delete permanently removes user data.</p>
          <div class="flex flex-col sm:flex-row gap-3">
            <button (click)="disableUser()" class="flex-1 bg-surface-2 hover:bg-surface-3 border border-border text-primary px-4 py-2 rounded-lg text-sm font-medium transition-colors">Disable User</button>
            <button (click)="deleteUser()" class="flex-1 bg-error/10 hover:bg-error/20 border border-error text-error px-4 py-2 rounded-lg text-sm font-medium transition-colors">Delete User</button>
          </div>
        </div>
      </section>
    </div>

    <ng-template #notFound>
      <div class="px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto py-16 text-center">
        <h2 class="text-2xl font-bold text-primary mb-2">Application not found</h2>
        <p class="text-secondary mb-6">The selected record does not exist or was deleted.</p>
        <a routerLink="/agent" class="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-white no-underline">Back to Queue</a>
      </div>
    </ng-template>
  `
})
export class AgentApplicationDetailsComponent implements OnInit {
  ApplicationStatus = ApplicationStatus;

  application = signal<AgentApplicationSummary | null>(null);
  user = signal<AgentUserProfile | null>(null);
  statusUpdates = signal<UserStatusUpdate[]>([]);

  activeTab = signal<'profile' | 'management'>('profile');
  noticeInput = '';

  newStatusHeading = '';
  newStatusDetails = '';
  newStatusBadge = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private agentData: AgentDataService
  ) { }

  ngOnInit() {
    const appId = this.route.snapshot.paramMap.get('id');
    if (!appId) {
      this.router.navigate(['/agent']);
      return;
    }

    const application = this.agentData.getApplicationById(appId);
    if (!application) {
      return;
    }

    const user = this.agentData.getUserById(application.userId);
    if (!user) {
      return;
    }

    this.application.set(application);
    this.user.set(user);
    this.statusUpdates.set(this.agentData.getStatusUpdates(user.id));
  }

  refreshCurrent() {
    const current = this.application();
    if (!current) return;

    const nextApplication = this.agentData.getApplicationById(current.applicationId);
    if (nextApplication) {
      this.application.set(nextApplication);
      const user = this.agentData.getUserById(nextApplication.userId);
      this.user.set(user);
      this.statusUpdates.set(this.agentData.getStatusUpdates(nextApplication.userId));
    }
  }

  canAdvanceStatus(): boolean {
    const status = this.application()?.status;
    return !!status && status !== ApplicationStatus.COMPLETED && status !== ApplicationStatus.REJECTED && status !== ApplicationStatus.BGV_IN_PROGRESS;
  }

  advanceStatus() {
    const app = this.application();
    if (!app) return;
    this.agentData.advanceStatus(app.applicationId);
    this.refreshCurrent();
  }

  holdApplication() {
    const app = this.application();
    if (!app) return;
    this.agentData.quickAction(app.applicationId, 'hold');
    this.refreshCurrent();
  }

  approveBGV() {
    const app = this.application();
    if (!app) return;
    this.agentData.approveBGV(app.applicationId);
    this.agentData.addStatusUpdate(app.userId, {
      heading: 'BGV Approved',
      details: 'Your background verification is approved.',
      badge: 'Completed'
    }, true);
    this.refreshCurrent();
  }

  rejectBGV() {
    const app = this.application();
    if (!app) return;

    const reason = prompt('Enter BGV rejection reason (mandatory):');
    if (!reason || !reason.trim()) {
      return;
    }

    this.agentData.rejectBGV(app.applicationId, reason.trim());
    this.agentData.addStatusUpdate(app.userId, {
      heading: 'BGV Rejected',
      details: reason.trim(),
      badge: 'Rejected'
    }, true);
    this.refreshCurrent();
  }

  addStatusUpdate() {
    const user = this.user();
    if (!user) return;

    const result = this.agentData.addStatusUpdate(user.id, {
      heading: this.newStatusHeading,
      details: this.newStatusDetails,
      badge: this.newStatusBadge
    });

    if (!result.ok) {
      alert(result.error || 'Could not add status');
      return;
    }

    this.newStatusHeading = '';
    this.newStatusDetails = '';
    this.newStatusBadge = '';
    this.refreshCurrent();
  }

  removeStatusUpdate(statusId: string) {
    const user = this.user();
    if (!user) return;
    this.agentData.removeStatusUpdate(user.id, statusId);
    this.refreshCurrent();
  }

  sendNotice() {
    const user = this.user();
    if (!user || !this.noticeInput.trim()) return;
    this.agentData.sendNotice(user.id, this.noticeInput.trim());
    this.noticeInput = '';
    this.refreshCurrent();
  }

  clearNotice() {
    const user = this.user();
    if (!user) return;
    this.agentData.clearNotice(user.id);
    this.refreshCurrent();
  }

  disableUser() {
    const user = this.user();
    if (!user) return;
    this.agentData.disableUser(user.id);
    this.refreshCurrent();
  }

  deleteUser() {
    const user = this.user();
    if (!user) return;

    if (!confirm(`Delete ${user.fullName} and all related data permanently?`)) {
      return;
    }

    this.agentData.deleteUser(user.id);
    this.router.navigate(['/agent']);
  }

  statusVariant(status: ApplicationStatus): 'success' | 'warning' | 'error' | 'neutral' | 'primary' {
    if (status === ApplicationStatus.COMPLETED) return 'success';
    if (status === ApplicationStatus.REJECTED) return 'error';
    if (status === ApplicationStatus.KYC_PAID || status === ApplicationStatus.AGREEMENT_PENDING || status === ApplicationStatus.AGREEMENT_DONE || status === ApplicationStatus.BGV_IN_PROGRESS) {
      return 'warning';
    }
    return 'primary';
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

  formatDateTime(value?: string): string {
    if (!value) return '-';
    return new Date(value).toLocaleString([], {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatInr(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  }

  mediaIcon(media: AgentUploadedMedia): string {
    return media.type;
  }
}
