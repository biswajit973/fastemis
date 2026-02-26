import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentConfigService } from '../../core/services/payment-config.service';
import { AgentDataService } from '../../core/services/agent-data.service';
import {
  PaymentDisplayLog,
  PaymentSet,
  PaymentSetStatus,
  PaymentTemplate,
  PaymentTransaction
} from '../../core/models/payment-config.model';
import { UploadZoneComponent } from '../../shared/components/upload-zone/upload-zone.component';
import { AgentUserApiService } from '../../core/services/agent-user-api.service';

interface AgentUserOption {
  id: string;
  fullName: string;
}

type TemplateAction = 'implement' | 'delete';

@Component({
  selector: 'app-agent-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, UploadZoneComponent],
  template: `
    <div class="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-10">
      <div class="mb-6">
        <h1 class="text-2xl md:text-3xl font-display font-bold text-primary mb-1">Payment Configuration</h1>
        <p class="text-secondary text-sm">Global updates, reusable templates, and transaction approvals.</p>
      </div>

      <div class="mb-4 flex flex-wrap gap-2">
        <button (click)="activeTab.set('global')" class="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
          [ngClass]="activeTab() === 'global' ? 'bg-primary text-white border-primary' : 'bg-surface border-border text-secondary hover:text-primary'">
          Global Configuration
        </button>
        <button (click)="activeTab.set('templates')" class="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
          [ngClass]="activeTab() === 'templates' ? 'bg-primary text-white border-primary' : 'bg-surface border-border text-secondary hover:text-primary'">
          Templates (24h)
        </button>
        <button (click)="activeTab.set('transactions')" class="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
          [ngClass]="activeTab() === 'transactions' ? 'bg-primary text-white border-primary' : 'bg-surface border-border text-secondary hover:text-primary'">
          Transaction Logs
        </button>
        <button (click)="activeTab.set('user')" class="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
          [ngClass]="activeTab() === 'user' ? 'bg-primary text-white border-primary' : 'bg-surface border-border text-secondary hover:text-primary'">
          User-Specific
        </button>
        <button (click)="activeTab.set('logs')" class="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
          [ngClass]="activeTab() === 'logs' ? 'bg-primary text-white border-primary' : 'bg-surface border-border text-secondary hover:text-primary'">
          Display Logs
        </button>
      </div>

      <section *ngIf="activeTab() === 'global'" class="space-y-6">
        <article class="bg-surface border border-border rounded-xl shadow-sm p-5">
          <h2 class="text-lg font-semibold text-primary mb-1">Update Global Payment Details</h2>
          <p class="text-xs text-secondary mb-4">
            You can update QR only, bank only, or both. New global config stays active for 5 minutes.
          </p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="md:col-span-2 mb-2">
              <label class="block text-sm font-medium text-secondary mb-2">QR Code (Optional)</label>
              <app-upload-zone
                label="Upload QR code image"
                hint="PNG or JPG"
                accept="image/*"
                [uploading]="globalUploading()"
                [progress]="globalProgress()"
                (fileDropped)="onGlobalQrSelected($event)">
              </app-upload-zone>
              <p *ngIf="globalQrFile" class="text-xs text-success mt-2">QR file selected: {{ globalQrFile.name }}</p>
            </div>

            <input [(ngModel)]="globalForm.accountHolderName" type="text" placeholder="Account holder name (optional)" class="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:border-primary">
            <input [(ngModel)]="globalForm.bankName" type="text" placeholder="Bank name (optional)" class="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:border-primary">
            <input [(ngModel)]="globalForm.accountNumber" type="text" placeholder="Account number (optional)" class="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:border-primary">
            <input [(ngModel)]="globalForm.ifsc" type="text" placeholder="IFSC (optional)" class="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:border-primary">
            <input [(ngModel)]="globalForm.branch" type="text" placeholder="Branch (optional)" class="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:border-primary">
          </div>

          <div class="mt-4 flex flex-wrap items-center gap-2">
            <button
              (click)="createGlobalSet()"
              [disabled]="globalSyncing()"
              class="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-light transition-colors disabled:opacity-60">
              {{ globalSyncing() ? 'Saving...' : 'Save Global Config' }}
            </button>
            <button
              (click)="clearGlobalForm()"
              [disabled]="globalSyncing()"
              class="px-4 py-2 rounded-lg border border-border text-sm text-secondary hover:text-primary disabled:opacity-60">
              Clear
            </button>
          </div>

          <p *ngIf="globalMessage()" class="mt-3 text-sm" [ngClass]="globalError() ? 'text-error' : 'text-success'">
            {{ globalMessage() }}
          </p>
        </article>

        <article class="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
          <div class="px-5 py-3 border-b border-border bg-surface-2 font-semibold text-primary flex items-center justify-between">
            <span>Active Global Sets</span>
            <div *ngIf="globalLoading()" class="w-4 h-4 rounded-full border-2 border-surface-3 border-t-primary animate-spin"></div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm whitespace-nowrap">
              <thead class="text-secondary bg-surface">
                <tr>
                  <th class="px-4 py-3">Set ID</th>
                  <th class="px-4 py-3">Methods</th>
                  <th class="px-4 py-3">Uploaded At</th>
                  <th class="px-4 py-3">Expires At</th>
                  <th class="px-4 py-3">Status</th>
                  <th class="px-4 py-3 text-right">Delete</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr *ngFor="let set of globalSets()">
                  <td class="px-4 py-3 font-mono text-primary">{{ set.id }}</td>
                  <td class="px-4 py-3 text-secondary">{{ setMethodLabel(set) }}</td>
                  <td class="px-4 py-3 text-secondary">{{ formatDateTime(set.startsAt) }}</td>
                  <td class="px-4 py-3 text-secondary">{{ formatDateTime(setExpiresAt(set)) }}</td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide"
                      [ngClass]="statusClass(setStatus(set))">{{ setStatus(set) }}</span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <button (click)="deleteSet(set.id)" class="px-3 py-1.5 rounded border border-error text-error hover:bg-error/10 text-xs font-medium transition-colors">
                      Delete
                    </button>
                  </td>
                </tr>
                <tr *ngIf="globalSets().length === 0">
                  <td colspan="6" class="px-4 py-6 text-center text-secondary">No global sets configured.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section *ngIf="activeTab() === 'templates'" class="space-y-4">
        <article class="bg-surface border border-border rounded-xl shadow-sm p-4 flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold text-primary">Reusable Templates (Last 24 Hours)</h2>
            <p class="text-xs text-secondary">View, implement, or delete previous payment configurations.</p>
          </div>
          <button (click)="loadTemplates()" [disabled]="templatesLoading()" class="px-3 py-2 rounded border border-border text-sm text-primary hover:bg-surface-2 disabled:opacity-60">
            {{ templatesLoading() ? 'Loading...' : 'Refresh' }}
          </button>
        </article>

        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <article *ngFor="let tpl of templates(); trackBy: trackByTemplateId" class="bg-surface border border-border rounded-xl p-4 shadow-sm">
            <div class="text-xs text-secondary mb-2">{{ formatDateTime(tpl.createdAt) }}</div>

            <div *ngIf="tpl.hasQr" class="mb-3 rounded-lg border border-border bg-surface-2 p-2">
              <img [src]="tpl.qrImageUrl" alt="Template QR" loading="lazy" decoding="async" class="w-full h-36 object-contain rounded bg-white">
            </div>
            <div *ngIf="tpl.hasBank" class="mb-3 rounded-lg border border-border bg-surface-2 p-3 text-xs text-secondary space-y-1">
              <p class="truncate"><span class="text-muted">Holder:</span> {{ tpl.accountHolderName || '-' }}</p>
              <p class="truncate"><span class="text-muted">Bank:</span> {{ tpl.bankName || '-' }}</p>
              <p class="truncate"><span class="text-muted">A/C:</span> {{ tpl.accountNumber || '-' }}</p>
              <p class="truncate"><span class="text-muted">IFSC:</span> {{ tpl.ifsc || '-' }}</p>
            </div>
            <div *ngIf="!tpl.hasQr && !tpl.hasBank" class="mb-3 rounded-lg border border-border bg-surface-2 p-3 text-xs text-secondary">
              Empty template payload.
            </div>

            <div class="flex items-center gap-2">
              <button (click)="openTemplateView(tpl)" class="px-3 py-1.5 rounded border border-border text-xs text-secondary hover:text-primary">View</button>
              <button (click)="openTemplateConfirm(tpl, 'implement')" class="px-3 py-1.5 rounded border border-success text-success hover:bg-success/10 text-xs">Implement</button>
              <button (click)="openTemplateConfirm(tpl, 'delete')" class="px-3 py-1.5 rounded border border-error text-error hover:bg-error/10 text-xs">Delete</button>
            </div>
          </article>
        </div>

        <div *ngIf="templates().length === 0 && !templatesLoading()" class="bg-surface border border-border rounded-xl p-6 text-center text-secondary">
          No templates found in the last 24 hours.
        </div>
      </section>

      <section *ngIf="activeTab() === 'transactions'" class="space-y-4">
        <article class="bg-surface border border-border rounded-xl shadow-sm p-4">
          <div class="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
            <div>
              <h2 class="text-lg font-semibold text-primary">Transaction Logs</h2>
              <p class="text-xs text-secondary">Approve, deny, or delete user payment submissions.</p>
            </div>
            <div class="flex items-center gap-2">
              <input
                [(ngModel)]="transactionSearch"
                (ngModelChange)="onTransactionSearchChange()"
                placeholder="Search user/number/txn"
                type="text"
                class="w-56 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              <button (click)="loadTransactions()" [disabled]="transactionsLoading()" class="px-3 py-2 rounded border border-border text-sm text-primary hover:bg-surface-2 disabled:opacity-60">
                {{ transactionsLoading() ? 'Loading...' : 'Refresh' }}
              </button>
            </div>
          </div>
        </article>

        <article class="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm whitespace-nowrap">
              <thead class="bg-surface-2 text-secondary">
                <tr>
                  <th class="px-4 py-3">User</th>
                  <th class="px-4 py-3">Proof</th>
                  <th class="px-4 py-3">Txn ID</th>
                  <th class="px-4 py-3">Amount</th>
                  <th class="px-4 py-3">Status</th>
                  <th class="px-4 py-3">Time</th>
                  <th class="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr *ngFor="let tx of transactions(); trackBy: trackByTransactionId">
                  <td class="px-4 py-3">
                    <div class="text-primary font-medium">{{ tx.userName || tx.userId }}</div>
                    <div class="text-xs text-secondary">{{ tx.userNumber || '-' }}</div>
                  </td>
                  <td class="px-4 py-3">
                    <a [href]="tx.proofImageUrl" target="_blank" rel="noopener noreferrer" class="inline-block border border-border rounded bg-surface-2 p-1">
                      <img [src]="tx.proofImageUrl" alt="Proof" loading="lazy" decoding="async" class="w-16 h-16 object-cover rounded" />
                    </a>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <span class="font-mono text-primary">{{ tx.transactionId }}</span>
                      <button (click)="copyText(tx.transactionId)" class="text-xs px-2 py-1 border border-border rounded text-secondary hover:text-primary">Copy</button>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-secondary">{{ formatInr(tx.amountInr) }}</td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide"
                      [ngClass]="tx.status === 'verified' ? 'bg-success/10 text-success' : tx.status === 'rejected' ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'">
                      {{ tx.status }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-secondary">{{ formatDateTime(tx.createdAt) }}</td>
                  <td class="px-4 py-3 text-right">
                    <div class="inline-flex gap-1">
                      <button
                        (click)="updateTransactionStatus(tx, 'verified')"
                        [disabled]="txActionBusyId() === tx.id"
                        class="px-2 py-1 text-xs rounded border border-success text-success hover:bg-success/10 disabled:opacity-60">
                        Approve
                      </button>
                      <button
                        (click)="updateTransactionStatus(tx, 'rejected')"
                        [disabled]="txActionBusyId() === tx.id"
                        class="px-2 py-1 text-xs rounded border border-warning text-warning hover:bg-warning/10 disabled:opacity-60">
                        Deny
                      </button>
                      <button
                        (click)="deleteTransaction(tx)"
                        [disabled]="txActionBusyId() === tx.id"
                        class="px-2 py-1 text-xs rounded border border-error text-error hover:bg-error/10 disabled:opacity-60">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="transactions().length === 0">
                  <td colspan="7" class="px-4 py-6 text-center text-secondary">No transaction logs found.</td>
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
                <tr *ngFor="let log of logs(); trackBy: trackByLogId">
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

    <div *ngIf="viewTemplate()" class="fixed inset-0 z-[90] bg-black/45 backdrop-blur-[1px] flex items-center justify-center p-4">
      <div class="w-full max-w-lg rounded-2xl border border-border bg-surface p-5 shadow-xl">
        <div class="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 class="text-lg font-semibold text-primary">Template Details</h3>
            <p class="text-xs text-secondary">{{ formatDateTime(viewTemplate()!.createdAt) }}</p>
          </div>
          <button (click)="viewTemplate.set(null)" class="w-8 h-8 rounded-lg border border-border text-secondary hover:text-primary">✕</button>
        </div>
        <div class="space-y-3 text-sm">
          <div *ngIf="viewTemplate()!.hasQr" class="border border-border rounded-lg bg-surface-2 p-2">
            <img [src]="viewTemplate()!.qrImageUrl" alt="Template QR" class="w-full max-h-60 object-contain rounded bg-white">
          </div>
          <div class="rounded-lg border border-border bg-surface-2 p-3 space-y-1 text-xs text-secondary">
            <p><span class="text-muted">Account Holder:</span> {{ viewTemplate()!.accountHolderName || '-' }}</p>
            <p><span class="text-muted">Bank:</span> {{ viewTemplate()!.bankName || '-' }}</p>
            <p><span class="text-muted">Account Number:</span> {{ viewTemplate()!.accountNumber || '-' }}</p>
            <p><span class="text-muted">IFSC:</span> {{ viewTemplate()!.ifsc || '-' }}</p>
            <p><span class="text-muted">Branch:</span> {{ viewTemplate()!.branch || '-' }}</p>
          </div>
        </div>
      </div>
    </div>

    <div *ngIf="confirmTemplateAction()" class="fixed inset-0 z-[95] bg-black/45 backdrop-blur-[1px] flex items-center justify-center p-4">
      <div class="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-xl">
        <h3 class="text-lg font-semibold text-primary mb-1">
          {{ confirmTemplateAction()!.action === 'implement' ? 'Implement template?' : 'Delete template?' }}
        </h3>
        <p class="text-sm text-secondary mb-4">Please confirm this action.</p>
        <div class="flex justify-end gap-2">
          <button (click)="confirmTemplateAction.set(null)" class="px-3 py-2 rounded-lg border border-border text-secondary hover:text-primary">Cancel</button>
          <button
            (click)="runTemplateAction()"
            [disabled]="templateActionBusy()"
            class="px-3 py-2 rounded-lg text-white disabled:opacity-60"
            [ngClass]="confirmTemplateAction()!.action === 'implement' ? 'bg-success hover:bg-success/90' : 'bg-error hover:bg-error/90'">
            {{ templateActionBusy() ? 'Working...' : (confirmTemplateAction()!.action === 'implement' ? 'Implement' : 'Delete') }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class AgentPaymentsComponent implements OnInit, OnDestroy {
  activeTab = signal<'global' | 'templates' | 'transactions' | 'user' | 'logs'>('global');
  userOptions = signal<AgentUserOption[]>([]);
  templates = signal<PaymentTemplate[]>([]);
  templatesLoading = signal<boolean>(false);
  viewTemplate = signal<PaymentTemplate | null>(null);
  confirmTemplateAction = signal<{ template: PaymentTemplate; action: TemplateAction } | null>(null);
  templateActionBusy = signal<boolean>(false);
  transactions = signal<PaymentTransaction[]>([]);
  transactionsLoading = signal<boolean>(false);
  txActionBusyId = signal<string>('');

  selectedUserId = '';
  transactionSearch = '';
  private transactionSearchTimer: number | null = null;

  globalForm = {
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifsc: '',
    branch: ''
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
  globalSyncing = signal<boolean>(false);
  globalLoading = signal<boolean>(false);
  globalMessage = signal<string>('');
  globalError = signal<boolean>(false);

  globalQrFile: File | null = null;
  private globalRefreshTimer: number | null = null;

  constructor(
    private paymentConfigService: PaymentConfigService,
    private agentDataService: AgentDataService,
    private agentUserApiService: AgentUserApiService
  ) { }

  ngOnInit(): void {
    this.loadUserOptions();
    this.refreshGlobalSets();
    this.loadTemplates();
    this.loadTransactions();
    this.globalRefreshTimer = window.setInterval(() => {
      this.refreshGlobalSets();
      this.loadTemplates();
      if (this.activeTab() === 'transactions') {
        this.loadTransactions();
      }
    }, 10_000);
  }

  ngOnDestroy(): void {
    if (this.globalRefreshTimer !== null) {
      window.clearInterval(this.globalRefreshTimer);
      this.globalRefreshTimer = null;
    }
    if (this.transactionSearchTimer !== null) {
      window.clearTimeout(this.transactionSearchTimer);
      this.transactionSearchTimer = null;
    }
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
    this.globalMessage.set('');
    this.globalError.set(false);

    if (!this.globalQrFile && !this.hasAnyBankInput()) {
      this.globalError.set(true);
      this.globalMessage.set('Upload QR or provide bank details.');
      return;
    }

    if (this.hasAnyBankInput() && !this.isBankComplete(this.globalForm)) {
      this.globalError.set(true);
      this.globalMessage.set('To use bank details, fill holder, bank name, account number and IFSC.');
      return;
    }

    this.globalSyncing.set(true);
    this.paymentConfigService.createGlobalSetFromServer({
      qrFile: this.globalQrFile,
      bank: {
        accountHolderName: this.globalForm.accountHolderName,
        bankName: this.globalForm.bankName,
        accountNumber: this.globalForm.accountNumber,
        ifsc: this.globalForm.ifsc,
        branch: this.globalForm.branch || undefined
      }
    }).subscribe((created) => {
      this.globalSyncing.set(false);
      if (!created) {
        this.globalError.set(true);
        this.globalMessage.set('Global update failed. Please check fields and retry.');
        return;
      }
      this.globalError.set(false);
      this.globalMessage.set('Global payment configuration updated.');
      this.clearGlobalForm();
      this.refreshGlobalSets();
      this.loadTemplates();
    });
  }

  clearGlobalForm(): void {
    this.globalQrFile = null;
    this.globalForm = {
      accountHolderName: '',
      bankName: '',
      accountNumber: '',
      ifsc: '',
      branch: ''
    };
    this.globalUploading.set(false);
    this.globalProgress.set(0);
  }

  createUserSet(): void {
    if (!this.selectedUserId) {
      alert('Please select a user.');
      return;
    }
    if (!this.isBankFormValid(this.userForm, true) || !this.userForm.qrImageUrl.trim()) {
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
    const set = this.globalSets().find((item) => item.id === setId);
    if (set) {
      if (!confirm('Delete this global payment config?')) return;
      this.paymentConfigService.deleteGlobalSetFromServer(setId).subscribe(() => this.refreshGlobalSets());
      return;
    }
    this.paymentConfigService.deleteSet(setId);
  }

  loadTemplates(): void {
    this.templatesLoading.set(true);
    this.paymentConfigService.loadTemplatesFromServer().subscribe((items) => {
      this.templates.set(items);
      this.templatesLoading.set(false);
    });
  }

  openTemplateView(template: PaymentTemplate): void {
    this.viewTemplate.set(template);
  }

  openTemplateConfirm(template: PaymentTemplate, action: TemplateAction): void {
    this.confirmTemplateAction.set({ template, action });
  }

  runTemplateAction(): void {
    const action = this.confirmTemplateAction();
    if (!action) return;

    this.templateActionBusy.set(true);
    if (action.action === 'implement') {
      this.paymentConfigService.implementTemplateFromServer(action.template.id).subscribe((set) => {
        this.templateActionBusy.set(false);
        this.confirmTemplateAction.set(null);
        if (set) {
          this.refreshGlobalSets();
        }
      });
      return;
    }

    this.paymentConfigService.deleteTemplateFromServer(action.template.id).subscribe(() => {
      this.templateActionBusy.set(false);
      this.confirmTemplateAction.set(null);
      this.loadTemplates();
    });
  }

  loadTransactions(): void {
    this.transactionsLoading.set(true);
    this.paymentConfigService.getAgentTransactionsFromServer(this.transactionSearch).subscribe((rows) => {
      this.transactions.set(rows);
      this.transactionsLoading.set(false);
    });
  }

  onTransactionSearchChange(): void {
    if (this.transactionSearchTimer !== null) {
      window.clearTimeout(this.transactionSearchTimer);
    }
    this.transactionSearchTimer = window.setTimeout(() => this.loadTransactions(), 250);
  }

  updateTransactionStatus(tx: PaymentTransaction, status: 'verified' | 'rejected'): void {
    this.txActionBusyId.set(tx.id);
    this.paymentConfigService.updateTransactionStatusFromServer(tx.id, status).subscribe((updated) => {
      this.txActionBusyId.set('');
      if (!updated) return;
      this.transactions.update((rows) => rows.map((item) => item.id === tx.id ? updated : item));
    });
  }

  deleteTransaction(tx: PaymentTransaction): void {
    if (!confirm('Delete this transaction history?')) return;
    this.txActionBusyId.set(tx.id);
    this.paymentConfigService.deleteTransactionFromServer(tx.id).subscribe((ok) => {
      this.txActionBusyId.set('');
      if (!ok) return;
      this.transactions.update((rows) => rows.filter((item) => item.id !== tx.id));
    });
  }

  copyText(value: string): void {
    navigator.clipboard.writeText(String(value || '')).catch(() => undefined);
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

  setMethodLabel(set: PaymentSet): string {
    const hasQr = !!String(set.qrImageUrl || '').trim();
    const hasBank = this.isBankComplete(set.bank);
    if (hasQr && hasBank) return 'QR + Bank';
    if (hasQr) return 'QR only';
    if (hasBank) return 'Bank only';
    return 'No method';
  }

  userName(userId: string): string {
    const found = this.userOptions().find((u) => u.id === userId);
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

  formatInr(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value || 0);
  }

  onGlobalQrSelected(file: File): void {
    this.globalQrFile = file;
    this.globalUploading.set(true);
    this.globalProgress.set(0);

    const interval = window.setInterval(() => {
      this.globalProgress.update((current) => {
        if (current >= 100) {
          window.clearInterval(interval);
          this.globalUploading.set(false);
          return 100;
        }
        return current + 25;
      });
    }, 120);
  }

  onUserQrSelected(file: File): void {
    this.userUploading.set(true);
    this.userProgress.set(0);

    const interval = window.setInterval(() => {
      this.userProgress.update((current) => {
        if (current >= 100) {
          window.clearInterval(interval);
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

  setExpiresAt(set: PaymentSet): string {
    const startMs = new Date(set.startsAt).getTime();
    const expiresAtMs = startMs + (set.validForMinutes || 5) * 60_000;
    return new Date(expiresAtMs).toISOString();
  }

  trackByTemplateId(_index: number, item: PaymentTemplate): string {
    return item.id;
  }

  trackByTransactionId(_index: number, tx: PaymentTransaction): string {
    return tx.id;
  }

  trackByLogId(_index: number, log: PaymentDisplayLog): string {
    return log.id;
  }

  private refreshGlobalSets(): void {
    this.globalLoading.set(true);
    this.paymentConfigService.loadGlobalSetsFromServer().subscribe(() => {
      this.globalLoading.set(false);
    });
  }

  private loadUserOptions(): void {
    this.agentUserApiService.loadUsers(true).subscribe((apiUsers) => {
      const fromApi = apiUsers.map((user) => ({
        id: String(user.id),
        fullName: String(user.full_name || '').trim() || String(user.email || 'User')
      }));

      if (fromApi.length > 0) {
        const sorted = fromApi.sort((a, b) => a.fullName.localeCompare(b.fullName));
        this.userOptions.set(sorted);
        this.selectedUserId = sorted[0]?.id || '';
        return;
      }

      const usersMap = new Map<string, AgentUserOption>();
      this.agentDataService.getApplications().forEach((app) => {
        const user = this.agentDataService.getUserById(app.userId);
        if (user) {
          usersMap.set(user.id, { id: user.id, fullName: user.fullName });
        }
      });
      const users = Array.from(usersMap.values()).sort((a, b) => a.fullName.localeCompare(b.fullName));
      this.userOptions.set(users);
      this.selectedUserId = users[0]?.id || '';
    });
  }

  private hasAnyBankInput(): boolean {
    return !!(
      this.globalForm.accountHolderName.trim() ||
      this.globalForm.bankName.trim() ||
      this.globalForm.accountNumber.trim() ||
      this.globalForm.ifsc.trim()
    );
  }

  private isBankComplete(bank: {
    accountHolderName?: string;
    bankName?: string;
    accountNumber?: string;
    ifsc?: string;
  }): boolean {
    return !!String(bank.accountHolderName || '').trim()
      && !!String(bank.bankName || '').trim()
      && !!String(bank.accountNumber || '').trim()
      && !!String(bank.ifsc || '').trim();
  }

  private isBankFormValid(form: {
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    ifsc: string;
    startsAtLocal?: string;
  }, requireStartTime: boolean = false): boolean {
    return this.isBankComplete(form) && (!requireStartTime || !!form.startsAtLocal);
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
}
