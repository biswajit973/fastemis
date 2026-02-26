import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AgentUserSummary } from '../../core/models/agent-user.model';
import { AgentUserApiService } from '../../core/services/agent-user-api.service';

@Component({
  selector: 'app-agent-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-3 sm:px-5 lg:px-8 max-w-7xl mx-auto pb-8">
      <div class="mb-5">
        <h1 class="text-2xl sm:text-3xl font-display font-bold text-primary mb-1">Applicants Queue</h1>
        <p class="text-sm text-secondary">Real-time signup and profile completion data from backend users.</p>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div class="rounded-xl border border-border bg-surface p-4">
          <p class="text-xs text-secondary mb-1">Total Users</p>
          <p class="text-2xl font-bold text-primary">{{ stats().total }}</p>
        </div>
        <div class="rounded-xl border border-border bg-surface p-4">
          <p class="text-xs text-secondary mb-1">Profile Complete</p>
          <p class="text-2xl font-bold text-success">{{ stats().complete }}</p>
        </div>
        <div class="rounded-xl border border-border bg-surface p-4">
          <p class="text-xs text-secondary mb-1">Not Filled Yet</p>
          <p class="text-2xl font-bold text-warning">{{ stats().incomplete }}</p>
        </div>
        <div class="rounded-xl border border-border bg-surface p-4">
          <p class="text-xs text-secondary mb-1">Disabled</p>
          <p class="text-2xl font-bold text-error">{{ stats().disabled }}</p>
        </div>
      </div>

      <div class="mb-4 flex items-center justify-between">
        <p class="text-sm text-secondary">Tap a user row to open profile details or management.</p>
        <button type="button" (click)="refresh()" [disabled]="loading()"
          class="px-3 py-2 rounded-lg border border-border text-sm text-primary hover:bg-surface-2 disabled:opacity-60">
          {{ loading() ? 'Refreshing...' : 'Refresh' }}
        </button>
      </div>

      <div *ngIf="loading() && users().length === 0" class="rounded-xl border border-border bg-surface p-8 flex items-center justify-center">
        <div class="w-8 h-8 rounded-full border-2 border-surface-3 border-t-primary animate-spin"></div>
      </div>

      <div *ngIf="!loading() && users().length === 0" class="rounded-xl border border-border bg-surface p-6 text-center text-secondary">
        No signed-up users found yet.
      </div>

      <div class="md:hidden space-y-3" *ngIf="users().length > 0">
        <article *ngFor="let user of users(); trackBy: trackByUserId" class="rounded-xl border border-border bg-surface p-4">
          <div class="flex items-start justify-between gap-2 mb-2">
            <div>
              <h2 class="text-sm font-semibold text-primary">{{ displayValue(user.full_name) }}</h2>
              <p class="text-xs text-secondary">ID: {{ user.id }}</p>
            </div>
            <span class="px-2 py-1 rounded-full text-[11px] font-semibold"
              [ngClass]="user.profile_complete ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'">
              {{ user.profile_complete ? 'Filled' : 'Not Filled Yet' }}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-2 text-xs mb-3">
            <div><span class="text-secondary">Email</span><p class="text-primary break-all">{{ displayValue(user.email) }}</p></div>
            <div><span class="text-secondary">Mobile</span><p class="text-primary">{{ displayValue(user.mobile_number) }}</p></div>
            <div><span class="text-secondary">Requested</span><p class="text-primary">{{ formatRequestedAmount(user.requested_amount) }}</p></div>
            <div><span class="text-secondary">Missing Fields</span><p class="text-primary">{{ user.missing_fields.length }}</p></div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <a [routerLink]="['/agent/applications', user.id]" [queryParams]="{ tab: 'profile' }"
              class="text-center px-3 py-2 rounded-lg border border-border text-xs font-medium text-primary no-underline hover:bg-surface-2">
              Profile Details
            </a>
            <a [routerLink]="['/agent/applications', user.id]" [queryParams]="{ tab: 'management' }"
              class="text-center px-3 py-2 rounded-lg border border-border text-xs font-medium text-primary no-underline hover:bg-surface-2">
              Management
            </a>
          </div>
        </article>
      </div>

      <div class="hidden md:block overflow-x-auto rounded-xl border border-border bg-surface" *ngIf="users().length > 0">
        <table class="min-w-full text-sm">
          <thead class="bg-surface-2 border-b border-border text-secondary">
            <tr>
              <th class="px-4 py-3 text-left font-medium">User</th>
              <th class="px-4 py-3 text-left font-medium">Contact</th>
              <th class="px-4 py-3 text-left font-medium">Requested Amount</th>
              <th class="px-4 py-3 text-left font-medium">Profile Status</th>
              <th class="px-4 py-3 text-left font-medium">Filled</th>
              <th class="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr *ngFor="let user of users(); trackBy: trackByUserId" class="hover:bg-surface-2/50">
              <td class="px-4 py-3 align-top">
                <p class="font-semibold text-primary">{{ displayValue(user.full_name) }}</p>
                <p class="text-xs text-secondary">ID: {{ user.id }}</p>
              </td>
              <td class="px-4 py-3 align-top">
                <p class="text-primary">{{ displayValue(user.mobile_number) }}</p>
                <p class="text-xs text-secondary break-all">{{ displayValue(user.email) }}</p>
              </td>
              <td class="px-4 py-3 align-top text-primary">{{ formatRequestedAmount(user.requested_amount) }}</td>
              <td class="px-4 py-3 align-top">
                <span class="px-2 py-1 rounded-full text-xs font-semibold"
                  [ngClass]="user.profile_complete ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'">
                  {{ user.profile_complete ? 'Filled' : 'Not Filled Yet' }}
                </span>
                <p class="mt-1 text-xs text-secondary">
                  {{ user.profile_progress }}% complete • {{ user.missing_fields.length }} missing
                </p>
              </td>
              <td class="px-4 py-3 align-top text-primary">
                {{ user.filled_fields_count }}/{{ user.total_required_fields }}
              </td>
              <td class="px-4 py-3 align-top text-right">
                <div class="inline-flex gap-2">
                  <a [routerLink]="['/agent/applications', user.id]" [queryParams]="{ tab: 'profile' }"
                    class="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-primary no-underline hover:bg-surface-2">
                    Profile Details
                  </a>
                  <a [routerLink]="['/agent/applications', user.id]" [queryParams]="{ tab: 'management' }"
                    class="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-primary no-underline hover:bg-surface-2">
                    Management
                  </a>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AgentDashboardComponent implements OnInit {
  private readonly agentUsersApi = inject(AgentUserApiService);

  readonly users = this.agentUsersApi.users;
  readonly loading = this.agentUsersApi.loading;
  readonly stats = computed(() => {
    const users = this.users();
    let complete = 0;
    let disabled = 0;
    for (const user of users) {
      if (user.profile_complete) complete += 1;
      if (!user.is_active) disabled += 1;
    }
    return {
      total: users.length,
      complete,
      incomplete: users.length - complete,
      disabled
    };
  });

  private readonly initialized = signal(false);

  ngOnInit(): void {
    if (this.initialized()) {
      return;
    }
    this.initialized.set(true);
    this.agentUsersApi.loadUsers(true).subscribe();
  }

  refresh(): void {
    this.agentUsersApi.loadUsers(true).subscribe();
  }

  trackByUserId(_index: number, user: AgentUserSummary): string {
    return String(user.id);
  }

  displayValue(value: string): string {
    const raw = String(value || '').trim();
    return raw || 'Not filled yet';
  }

  formatRequestedAmount(value: string): string {
    const raw = String(value || '').trim();
    if (!raw || raw.toLowerCase() === 'not filled yet') {
      return 'Not filled yet';
    }

    const asNumber = Number(raw);
    if (!Number.isFinite(asNumber) || asNumber <= 0) {
      return raw;
    }

    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(asNumber);
  }
}
