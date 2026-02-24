import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentConfigService } from '../../core/services/payment-config.service';
import { AgentDataService } from '../../core/services/agent-data.service';
import { PaymentDisplayLog, PaymentSet, PaymentSetStatus } from '../../core/models/payment-config.model';
import { UploadZoneComponent } from '../../shared/components/upload-zone/upload-zone.component';

interface AgentUserOption {
  id: string;
  fullName: string;
}

@Component({
  selector: 'app-agent-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, UploadZoneComponent],
  template: `
    <div class="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-10">
      <div class="mb-6">
        <h1 class="text-2xl md:text-3xl font-display font-bold text-primary mb-1">Payment Configuration</h1>
        <p class="text-secondary text-sm">Manage rotating global payment details and user-specific overrides.</p>
      </div>

      <div class="mb-4 flex flex-wrap gap-2">
        <button
          (click)="activeTab.set('global')"
          class="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
          [ngClass]="activeTab() === 'global' ? 'bg-primary text-white border-primary' : 'bg-surface border-border text-secondary hover:text-primary'">
          Global Configuration
        </button>
        <button
          (click)="activeTab.set('user')"
          class="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
          [ngClass]="activeTab() === 'user' ? 'bg-primary text-white border-primary' : 'bg-surface border-border text-secondary hover:text-primary'">
          User-Specific Configuration
        </button>
        <button
          (click)="activeTab.set('logs')"
          class="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
          [ngClass]="activeTab() === 'logs' ? 'bg-primary text-white border-primary' : 'bg-surface border-border text-secondary hover:text-primary'">
          Display Logs
        </button>
      </div>

      <section *ngIf="activeTab() === 'global'" class="space-y-6">
        <article class="bg-surface border border-border rounded-xl shadow-sm p-5">
          <h2 class="text-lg font-semibold text-primary mb-1">Create Global Payment Set</h2>
          <p class="text-xs text-secondary mb-4">Global validity is fixed to 10 minutes. If multiple active global sets exist, they auto-rotate every 10 minutes.</p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="md:col-span-2 mb-2">
              <label class="block text-sm font-medium text-secondary mb-2">Payment QR Code</label>
              <app-upload-zone
                label="Upload QR code image"
                hint="PNG or JPG recommended"
                accept="image/*"
                [uploading]="globalUploading()"
                [progress]="globalProgress()"
                (fileDropped)="onGlobalQrSelected($event)">
              </app-upload-zone>
              <p *ngIf="globalForm.qrImageUrl" class="text-xs text-success mt-2">QR Image ready.</p>
            </div>
            
            <input [(ngModel)]="globalForm.accountHolderName" type="text" placeholder="Account holder name" class="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:border-primary">
            <input [(ngModel)]="globalForm.bankName" type="text" placeholder="Bank name" class="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:border-primary">
            <input [(ngModel)]="globalForm.accountNumber" type="text" placeholder="Account number" class="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:border-primary">
            <input [(ngModel)]="globalForm.ifsc" type="text" placeholder="IFSC" class="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:border-primary">
            <input [(ngModel)]="globalForm.branch" type="text" placeholder="Branch (optional)" class="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:border-primary">
            <div class="flex flex-col">
              <label class="text-xs text-secondary mb-1">Start Time (Local)</label>
              <input [(ngModel)]="globalForm.startsAtLocal" type="datetime-local" class="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:border-primary">
            </div>
          </div>

          <div class="mt-4">
            <button (click)="createGlobalSet()" class="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-light transition-colors">
              Add Global Set
            </button>
          </div>
        </article>

        <article class="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
          <div class="px-5 py-3 border-b border-border bg-surface-2 font-semibold text-primary">Global Sets</div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm whitespace-nowrap">
              <thead class="text-secondary bg-surface">
                <tr>
                  <th class="px-4 py-3">Set ID</th>
                  <th class="px-4 py-3">Start Time</th>
                  <th class="px-4 py-3">Status</th>
                  <th class="px-4 py-3">Serving Now</th>
                  <th class="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr *ngFor="let set of globalSets()">
                  <td class="px-4 py-3 font-mono text-primary">{{ set.id }}</td>
                  <td class="px-4 py-3 text-secondary">{{ formatDateTime(set.startsAt) }}</td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide"
                      [ngClass]="statusClass(setStatus(set))">{{ setStatus(set) }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <span *ngIf="isGlobalServingNow(set.id)" class="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-success/10 text-success">
                      Active Slot
                    </span>
                    <span *ngIf="!isGlobalServingNow(set.id)" class="text-muted">-</span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <div class="inline-flex items-center gap-2">
                      <button (click)="toggleSet(set)" class="px-3 py-1.5 rounded border text-xs font-medium transition-colors"
                        [ngClass]="set.isActive ? 'border-warning text-warning hover:bg-warning/10' : 'border-success text-success hover:bg-success/10'">
                        {{ set.isActive ? 'Deactivate' : 'Activate' }}
                      </button>
                      <button (click)="deleteSet(set.id)" class="px-3 py-1.5 rounded border border-error text-error hover:bg-error/10 text-xs font-medium transition-colors">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="globalSets().length === 0">
                  <td colspan="5" class="px-4 py-6 text-center text-secondary">No global sets configured.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section *ngIf="activeTab() === 'user'" class="space-y-6">
        <article class="bg-surface border border-border rounded-xl shadow-sm p-5">
          <h2 class="text-lg font-semibold text-primary mb-4">Create User-Specific Override</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="md:col-span-2">
              <label class="text-xs text-secondary mb-1 block">Target User Account</label>
              <select [(ngModel)]="selectedUserId" class="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:border-primary">
                <option value="">Select user</option>
                <option *ngFor="let u of userOptions()" [value]="u.id">{{ u.fullName }} ({{ u.id }})</option>
              </select>
            </div>

            <div class="md:col-span-2 mb-2 mt-2">
              <label class="block text-sm font-medium text-secondary mb-2">User Override QR Code</label>
              <app-upload-zone
                label="Upload target QR code image"
                hint="PNG or JPG recommended"
                accept="image/*"
                [uploading]="userUploading()"
                [progress]="userProgress()"
                (fileDropped)="onUserQrSelected($event)">
              </app-upload-zone>
              <p *ngIf="userForm.qrImageUrl" class="text-xs text-success mt-2">QR Image ready.</p>
            </div>

            <input [(ngModel)]="userForm.accountHolderName" type="text" placeholder="Account holder name" class="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:border-primary">
            <input [(ngModel)]="userForm.bankName" type="text" placeholder="Bank name" class="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:border-primary">
            <input [(ngModel)]="userForm.accountNumber" type="text" placeholder="Account number" class="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:border-primary">
            <input [(ngModel)]="userForm.ifsc" type="text" placeholder="IFSC" class="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:border-primary">
            <input [(ngModel)]="userForm.branch" type="text" placeholder="Branch (optional)" class="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:border-primary">
            
            <div class="flex flex-col">
              <label class="text-xs text-secondary mb-1">Start Time (Local)</label>
              <input [(ngModel)]="userForm.startsAtLocal" type="datetime-local" class="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:border-primary">
            </div>

            <div class="flex flex-col md:col-span-2">
              <label class="text-xs font-semibold text-secondary mb-1">Validity Period (in minutes)</label>
              <input [(ngModel)]="userForm.validForMinutes" type="number" min="1" placeholder="e.g. 10" class="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:border-primary">
            </div>
          </div>

          <div class="mt-4">
            <button (click)="createUserSet()" class="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-light transition-colors">
              Add User-Specific Set
            </button>
          </div>
        </article>

        <article class="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
          <div class="px-5 py-3 border-b border-border bg-surface-2 font-semibold text-primary">User-Specific Sets</div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm whitespace-nowrap">
              <thead class="text-secondary bg-surface">
                <tr>
                  <th class="px-4 py-3">Set ID</th>
                  <th class="px-4 py-3">Start Time</th>
                  <th class="px-4 py-3">Valid For</th>
                  <th class="px-4 py-3">Status</th>
                  <th class="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr *ngFor="let set of userSets()">
                  <td class="px-4 py-3 font-mono text-primary">{{ set.id }}</td>
                  <td class="px-4 py-3 text-secondary">{{ formatDateTime(set.startsAt) }}</td>
                  <td class="px-4 py-3 text-secondary">{{ set.validForMinutes }} min</td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide"
                      [ngClass]="statusClass(setStatus(set))">{{ setStatus(set) }}</span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <div class="inline-flex items-center gap-2">
                      <button (click)="toggleSet(set)" class="px-3 py-1.5 rounded border text-xs font-medium transition-colors"
                        [ngClass]="set.isActive ? 'border-warning text-warning hover:bg-warning/10' : 'border-success text-success hover:bg-success/10'">
                        {{ set.isActive ? 'Deactivate' : 'Activate' }}
                      </button>
                      <button (click)="deleteSet(set.id)" class="px-3 py-1.5 rounded border border-error text-error hover:bg-error/10 text-xs font-medium transition-colors">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="userSets().length === 0">
                  <td colspan="5" class="px-4 py-6 text-center text-secondary">No user-specific sets configured for selected user.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section *ngIf="activeTab() === 'logs'" class="space-y-4">
        <article class="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
          <div class="px-5 py-3 border-b border-border bg-surface-2 font-semibold text-primary">Display Logs</div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm whitespace-nowrap">
              <thead class="text-secondary bg-surface">
                <tr>
                  <th class="px-4 py-3">Shown At</th>
                  <th class="px-4 py-3">User</th>
                  <th class="px-4 py-3">Set ID</th>
                  <th class="px-4 py-3">Scope</th>
                  <th class="px-4 py-3">Expires At</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr *ngFor="let log of logs()">
                  <td class="px-4 py-3 text-secondary">{{ formatDateTime(log.shownAt) }}</td>
                  <td class="px-4 py-3 text-primary">{{ userName(log.userId) }}</td>
                  <td class="px-4 py-3 font-mono text-primary">{{ log.setId }}</td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide"
                      [ngClass]="log.scope === 'user' ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'">
                      {{ log.scope }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-secondary">{{ formatDateTime(log.expiresAt) }}</td>
                </tr>
                <tr *ngIf="logs().length === 0">
                  <td colspan="5" class="px-4 py-6 text-center text-secondary">No display logs found.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  `
})
export class AgentPaymentsComponent implements OnInit {
  activeTab = signal<'global' | 'user' | 'logs'>('global');
  userOptions = signal<AgentUserOption[]>([]);

  selectedUserId = '';

  globalForm = {
    qrImageUrl: '',
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifsc: '',
    branch: '',
    startsAtLocal: this.defaultLocalDateTime()
  };

  userForm = {
    qrImageUrl: '',
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifsc: '',
    branch: '',
    startsAtLocal: this.defaultLocalDateTime(),
    validForMinutes: 10
  };

  globalUploading = signal<boolean>(false);
  globalProgress = signal<number>(0);

  userUploading = signal<boolean>(false);
  userProgress = signal<number>(0);

  constructor(
    private paymentConfigService: PaymentConfigService,
    private agentDataService: AgentDataService
  ) { }

  ngOnInit(): void {
    const usersMap = new Map<string, AgentUserOption>();
    this.agentDataService.getApplications().forEach(app => {
      const user = this.agentDataService.getUserById(app.userId);
      if (user) {
        usersMap.set(user.id, { id: user.id, fullName: user.fullName });
      }
    });

    const users = Array.from(usersMap.values()).sort((a, b) => a.fullName.localeCompare(b.fullName));
    this.userOptions.set(users);
    this.selectedUserId = users[0]?.id || '';
  }

  globalSets(): PaymentSet[] {
    return this.paymentConfigService.getGlobalSets();
  }

  userSets(): PaymentSet[] {
    if (!this.selectedUserId) {
      return [];
    }
    return this.paymentConfigService.getUserSets(this.selectedUserId);
  }

  logs(): PaymentDisplayLog[] {
    return this.paymentConfigService.getDisplayLogs();
  }

  createGlobalSet(): void {
    if (!this.isBankFormValid(this.globalForm) || !this.globalForm.qrImageUrl.trim()) {
      alert('Please fill all required fields for global set.');
      return;
    }

    this.paymentConfigService.createSet({
      scope: 'global',
      qrImageUrl: this.globalForm.qrImageUrl,
      bank: {
        accountHolderName: this.globalForm.accountHolderName,
        bankName: this.globalForm.bankName,
        accountNumber: this.globalForm.accountNumber,
        ifsc: this.globalForm.ifsc,
        branch: this.globalForm.branch || undefined
      },
      validForMinutes: 10,
      startsAt: this.localToIso(this.globalForm.startsAtLocal),
      isActive: true
    });

    this.globalForm = {
      qrImageUrl: '',
      accountHolderName: '',
      bankName: '',
      accountNumber: '',
      ifsc: '',
      branch: '',
      startsAtLocal: this.defaultLocalDateTime()
    };
    this.globalProgress.set(0);
    this.globalUploading.set(false);
  }

  createUserSet(): void {
    if (!this.selectedUserId) {
      alert('Please select a user.');
      return;
    }

    if (!this.isBankFormValid(this.userForm) || !this.userForm.qrImageUrl.trim()) {
      alert('Please fill all required fields for user-specific set.');
      return;
    }

    const validFor = Math.max(1, Number(this.userForm.validForMinutes || 10));
    this.paymentConfigService.createSet({
      scope: 'user',
      userId: this.selectedUserId,
      qrImageUrl: this.userForm.qrImageUrl,
      bank: {
        accountHolderName: this.userForm.accountHolderName,
        bankName: this.userForm.bankName,
        accountNumber: this.userForm.accountNumber,
        ifsc: this.userForm.ifsc,
        branch: this.userForm.branch || undefined
      },
      validForMinutes: validFor,
      startsAt: this.localToIso(this.userForm.startsAtLocal),
      isActive: true
    });

    this.userForm = {
      qrImageUrl: '',
      accountHolderName: '',
      bankName: '',
      accountNumber: '',
      ifsc: '',
      branch: '',
      startsAtLocal: this.defaultLocalDateTime(),
      validForMinutes: 10
    };
    this.userProgress.set(0);
    this.userUploading.set(false);
  }

  toggleSet(set: PaymentSet): void {
    this.paymentConfigService.toggleSet(set.id, !set.isActive);
  }

  deleteSet(setId: string): void {
    this.paymentConfigService.deleteSet(setId);
  }

  setStatus(set: PaymentSet): PaymentSetStatus {
    return this.paymentConfigService.getSetStatus(set);
  }

  statusClass(status: PaymentSetStatus): string {
    if (status === 'active') return 'bg-success/10 text-success';
    if (status === 'scheduled') return 'bg-warning/10 text-warning';
    if (status === 'expired') return 'bg-error/10 text-error';
    return 'bg-surface-3 text-secondary';
  }

  isGlobalServingNow(setId: string): boolean {
    return this.paymentConfigService.isGlobalSetSelectedNow(setId);
  }

  userName(userId: string): string {
    const found = this.userOptions().find(u => u.id === userId);
    return found ? `${found.fullName} (${userId})` : userId;
  }

  formatDateTime(value: string): string {
    return new Date(value).toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private isBankFormValid(form: {
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    ifsc: string;
    startsAtLocal: string;
  }): boolean {
    return !!form.accountHolderName.trim()
      && !!form.bankName.trim()
      && !!form.accountNumber.trim()
      && !!form.ifsc.trim()
      && !!form.startsAtLocal;
  }

  private localToIso(localDateTime: string): string {
    return new Date(localDateTime).toISOString();
  }

  private defaultLocalDateTime(): string {
    const d = new Date();
    d.setSeconds(0, 0);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 16);
  }

  onGlobalQrSelected(file: File): void {
    this.globalUploading.set(true);
    this.globalProgress.set(0);

    const interval = setInterval(() => {
      this.globalProgress.update(current => {
        if (current >= 100) {
          clearInterval(interval);
          this.globalUploading.set(false);
          return 100;
        }
        return current + 25;
      });
    }, 120);

    const reader = new FileReader();
    reader.onload = () => {
      this.globalForm.qrImageUrl = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  }

  onUserQrSelected(file: File): void {
    this.userUploading.set(true);
    this.userProgress.set(0);

    const interval = setInterval(() => {
      this.userProgress.update(current => {
        if (current >= 100) {
          clearInterval(interval);
          this.userUploading.set(false);
          return 100;
        }
        return current + 25;
      });
    }, 120);

    const reader = new FileReader();
    reader.onload = () => {
      this.userForm.qrImageUrl = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  }
}

