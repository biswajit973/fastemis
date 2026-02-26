import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DashboardNavComponent } from '../dashboard-nav/dashboard-nav.component';
import { CountdownTimerComponent } from '../../../../shared/components/countdown-timer/countdown-timer.component';
import { UploadZoneComponent } from '../../../../shared/components/upload-zone/upload-zone.component';
import { AuthService } from '../../../../core/services/auth.service';
import { ActivePaymentPayload, PaymentTransaction } from '../../../../core/models/payment-config.model';
import { PaymentConfigService } from '../../../../core/services/payment-config.service';
import { ApplicationService } from '../../../../core/services/application.service';

@Component({
  selector: 'app-send-payments',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, DashboardNavComponent, CountdownTimerComponent, UploadZoneComponent],
  template: `
    <app-dashboard-nav></app-dashboard-nav>

    <main class="pt-20 md:pt-28 pb-32 md:pb-16 md:pl-[300px] min-h-screen bg-surface-2">
      <div class="container max-w-5xl py-6">
        <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 class="text-2xl md:text-3xl font-bold text-primary mb-1">Send Payments</h1>
            <p class="text-sm text-secondary">Pay by QR or bank details. Transaction proof is mandatory.</p>
          </div>

          <div class="flex items-center gap-2">
            <button
              (click)="manualRefresh()"
              [disabled]="loadingPayment() || loadingTransactions()"
              class="px-4 py-2 rounded-lg border border-border bg-surface text-sm font-medium text-primary hover:border-primary transition-colors disabled:opacity-60">
              Refresh
            </button>
            <a routerLink="/dashboard" class="px-4 py-2 rounded-lg border border-border bg-surface text-sm font-medium text-primary no-underline hover:border-primary transition-colors">
              Back
            </a>
          </div>
        </div>

        <div *ngIf="loadingPayment()" class="rounded-xl border border-border bg-surface p-6 flex items-center justify-center mb-6">
          <div class="w-8 h-8 rounded-full border-2 border-surface-3 border-t-primary animate-spin"></div>
        </div>

        <div *ngIf="activePayment(); else noPaymentDetails" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section class="bg-surface border border-border rounded-2xl p-6 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <h2 class="font-semibold text-primary">Scan QR Code</h2>
              <span class="text-[11px] font-bold px-2 py-1 rounded-full uppercase tracking-wider"
                [ngClass]="activePayment()!.scope === 'user' ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'">
                {{ sourceLabel(activePayment()!.scope) }}
              </span>
            </div>

            <div *ngIf="activePayment()!.hasQr !== false && activePayment()!.qrImageUrl; else noQrTemplate"
              class="border border-border rounded-xl bg-surface-2 p-4 flex items-center justify-center">
              <img
                [src]="activePayment()!.qrImageUrl"
                alt="Payment QR code"
                loading="lazy"
                decoding="async"
                class="w-full max-w-[260px] aspect-square object-contain rounded-lg border border-border bg-white p-2">
            </div>
            <ng-template #noQrTemplate>
              <div class="border border-border rounded-xl bg-surface-2 p-4 text-center text-sm text-secondary">
                QR not provided in current payment config.
              </div>
            </ng-template>

            <div class="mt-4 rounded-lg bg-surface-2 border border-border p-3">
              <div class="text-xs text-secondary mb-1">Current details expire in</div>
              <div class="text-base font-semibold text-primary">
                <app-countdown-timer
                  [targetDate]="activePayment()!.expiresAt"
                  (expired)="onCountdownExpired()">
                </app-countdown-timer>
              </div>
            </div>
          </section>

          <section class="bg-surface border border-border rounded-2xl p-6 shadow-sm">
            <h2 class="font-semibold text-primary mb-4">Bank Account Details</h2>
            <div *ngIf="hasAnyBankValue(activePayment()!); else noBankTemplate" class="space-y-3 text-sm">
              <div *ngIf="activePayment()!.bank.accountHolderName" class="rounded-lg border border-border bg-surface-2 p-3">
                <div class="text-xs text-secondary mb-1">Account Holder</div>
                <div class="font-medium text-primary">{{ activePayment()!.bank.accountHolderName }}</div>
              </div>
              <div *ngIf="activePayment()!.bank.bankName" class="rounded-lg border border-border bg-surface-2 p-3">
                <div class="text-xs text-secondary mb-1">Bank Name</div>
                <div class="font-medium text-primary">{{ activePayment()!.bank.bankName }}</div>
              </div>
              <div *ngIf="activePayment()!.bank.accountNumber" class="rounded-lg border border-border bg-surface-2 p-3">
                <div class="text-xs text-secondary mb-1">Account Number</div>
                <div class="font-medium text-primary font-mono tracking-wide">{{ activePayment()!.bank.accountNumber }}</div>
              </div>
              <div *ngIf="activePayment()!.bank.ifsc" class="rounded-lg border border-border bg-surface-2 p-3">
                <div class="text-xs text-secondary mb-1">IFSC</div>
                <div class="font-medium text-primary font-mono">{{ activePayment()!.bank.ifsc }}</div>
              </div>
              <div *ngIf="activePayment()!.bank.branch" class="rounded-lg border border-border bg-surface-2 p-3">
                <div class="text-xs text-secondary mb-1">Branch</div>
                <div class="font-medium text-primary">{{ activePayment()!.bank.branch }}</div>
              </div>
            </div>

            <ng-template #noBankTemplate>
              <div class="border border-border rounded-xl bg-surface-2 p-4 text-center text-sm text-secondary">
                Bank details not provided in current payment config.
              </div>
            </ng-template>
          </section>
        </div>

        <section class="bg-surface border border-border rounded-2xl p-6 shadow-sm mt-6">
          <h2 class="text-lg font-semibold text-primary mb-1">Submit Payment Proof</h2>
          <p class="text-xs text-secondary mb-4">Transaction Screenshot and Transaction ID are mandatory.</p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-secondary mb-2">Transaction Screenshot <span class="text-error">*</span></label>
              <app-upload-zone
                label="Upload payment screenshot"
                hint="PNG or JPG recommended"
                accept="image/*"
                [uploading]="uploadingProof()"
                [progress]="uploadProgress()"
                (fileDropped)="onProofSelected($event)">
              </app-upload-zone>
              <p *ngIf="proofError()" class="text-xs text-error mt-2">{{ proofError() }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-secondary mb-2">Transaction ID <span class="text-error">*</span></label>
              <input
                [(ngModel)]="transactionIdInput"
                type="text"
                placeholder="Enter transaction ID"
                class="w-full rounded-lg border px-3 py-2.5 text-sm bg-surface-2 text-primary focus:outline-none"
                [ngClass]="txnError() ? 'border-error focus:border-error' : 'border-border focus:border-primary'">
              <p *ngIf="txnError()" class="text-xs text-error mt-2">{{ txnError() }}</p>

              <div *ngIf="proofPreviewUrl()" class="mt-3 rounded-lg border border-border bg-surface p-2 max-w-sm">
                <img [src]="proofPreviewUrl()" alt="Proof preview" class="w-full max-h-44 rounded object-contain bg-white" />
              </div>

              <div class="mt-4">
                <button
                  (click)="submitTransaction()"
                  [disabled]="submitting()"
                  class="px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-light disabled:opacity-60 transition-colors">
                  {{ submitting() ? 'Submitting...' : 'Submit Payment' }}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section class="bg-surface border border-border rounded-2xl p-6 shadow-sm mt-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-primary">Transaction History</h2>
            <div class="flex items-center gap-3">
              <span class="text-xs text-secondary">{{ transactions().length }} record(s)</span>
              <div *ngIf="loadingTransactions()" class="w-4 h-4 rounded-full border-2 border-surface-3 border-t-primary animate-spin"></div>
            </div>
          </div>

          <div *ngIf="transactions().length > 0; else noHistory" class="space-y-3">
            <article *ngFor="let tx of transactions(); trackBy: trackByTxId" class="border border-border rounded-xl bg-surface-2 overflow-hidden">
              <button
                (click)="toggleTransaction(tx.id)"
                class="w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-surface transition-colors">
                <div class="min-w-0">
                  <div class="text-sm font-medium text-primary truncate">Txn ID: {{ tx.transactionId }}</div>
                  <div class="text-xs text-secondary mt-1">{{ formatDateTime(tx.createdAt) }} • {{ formatInr(tx.amountInr) }}</div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
                    [ngClass]="statusClass(tx.status)">
                    {{ tx.status }}
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    [ngClass]="expandedTransactionId() === tx.id ? 'rotate-180' : ''" class="text-secondary transition-transform">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </button>

              <div *ngIf="expandedTransactionId() === tx.id" class="px-4 pb-4 border-t border-border bg-surface">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                  <div class="border border-border rounded-lg bg-white p-2">
                    <img [src]="tx.proofImageUrl" alt="Transaction screenshot" class="w-full rounded-md object-contain max-h-64">
                  </div>
                  <div class="space-y-2 text-sm">
                    <div class="rounded-lg border border-border bg-surface-2 p-3">
                      <div class="text-xs text-secondary mb-1">Transaction ID</div>
                      <div class="font-medium text-primary font-mono">{{ tx.transactionId }}</div>
                    </div>
                    <div class="rounded-lg border border-border bg-surface-2 p-3">
                      <div class="text-xs text-secondary mb-1">Date & Time</div>
                      <div class="font-medium text-primary">{{ formatDateTime(tx.createdAt) }}</div>
                    </div>
                    <div class="rounded-lg border border-border bg-surface-2 p-3">
                      <div class="text-xs text-secondary mb-1">Status</div>
                      <div class="font-medium" [ngClass]="tx.status === 'pending' ? 'text-warning' : tx.status === 'verified' ? 'text-success' : 'text-error'">
                        {{ tx.status | titlecase }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <ng-template #noHistory>
            <p class="text-sm text-secondary">No transaction history yet.</p>
          </ng-template>
        </section>

        <ng-template #noPaymentDetails>
          <section class="bg-surface border border-border rounded-2xl p-10 text-center shadow-sm">
            <div class="w-14 h-14 rounded-full bg-surface-3 text-secondary flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h2 class="text-xl font-semibold text-primary mb-2">Payment Details Unavailable</h2>
            <p class="text-sm text-secondary">Payment details are being updated. Please refresh or try again in a few minutes.</p>
          </section>
        </ng-template>
      </div>
    </main>
  `
})
export class SendPaymentsComponent implements OnInit, OnDestroy {
  activePayment = signal<ActivePaymentPayload | null>(null);
  loadingPayment = signal<boolean>(false);

  transactions = signal<PaymentTransaction[]>([]);
  loadingTransactions = signal<boolean>(false);
  expandedTransactionId = signal<string | null>(null);

  uploadingProof = signal<boolean>(false);
  uploadProgress = signal<number>(0);
  proofFile = signal<File | null>(null);
  proofPreviewUrl = signal<string>('');
  submitting = signal<boolean>(false);

  proofError = signal<string>('');
  txnError = signal<string>('');
  transactionIdInput = '';

  private refreshTimer: number | null = null;
  private proofPreviewObjectUrl = '';

  constructor(
    private authService: AuthService,
    private paymentConfigService: PaymentConfigService,
    private applicationService: ApplicationService
  ) { }

  ngOnInit(): void {
    this.manualRefresh();
    this.refreshTimer = window.setInterval(() => this.manualRefresh(), 10_000);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer !== null) {
      window.clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.resetPreviewObjectUrl();
  }

  manualRefresh(): void {
    this.refreshPaymentDetails();
    this.refreshTransactions();
  }

  refreshPaymentDetails(): void {
    const userId = this.authService.currentUserSignal()?.id;
    if (!userId) {
      this.activePayment.set(null);
      return;
    }

    this.loadingPayment.set(true);
    this.paymentConfigService.getActivePaymentForUserFromServer(userId).subscribe((payload) => {
      this.activePayment.set(payload);
      if (payload) {
        this.paymentConfigService.logDisplay(payload, userId);
      }
      this.loadingPayment.set(false);
    });
  }

  refreshTransactions(): void {
    this.loadingTransactions.set(true);
    this.paymentConfigService.getUserTransactionsFromServer().subscribe((items) => {
      this.transactions.set(items);
      this.loadingTransactions.set(false);
    });
  }

  onCountdownExpired(): void {
    this.refreshPaymentDetails();
  }

  sourceLabel(scope: 'global' | 'user'): string {
    return scope === 'user' ? 'User-specific' : 'Global';
  }

  hasAnyBankValue(payload: ActivePaymentPayload): boolean {
    return !!(
      String(payload.bank.accountHolderName || '').trim() ||
      String(payload.bank.bankName || '').trim() ||
      String(payload.bank.accountNumber || '').trim() ||
      String(payload.bank.ifsc || '').trim() ||
      String(payload.bank.branch || '').trim()
    );
  }

  onProofSelected(file: File): void {
    this.proofError.set('');
    this.uploadingProof.set(true);
    this.uploadProgress.set(0);
    this.proofFile.set(file);

    this.resetPreviewObjectUrl();
    this.proofPreviewObjectUrl = URL.createObjectURL(file);
    this.proofPreviewUrl.set(this.proofPreviewObjectUrl);

    const interval = window.setInterval(() => {
      this.uploadProgress.update((current) => {
        if (current >= 100) {
          window.clearInterval(interval);
          this.uploadingProof.set(false);
          return 100;
        }
        return current + 20;
      });
    }, 100);
  }

  submitTransaction(): void {
    this.proofError.set('');
    this.txnError.set('');

    const proof = this.proofFile();
    if (!proof) {
      this.proofError.set('Transaction screenshot is required.');
    }

    const txId = this.transactionIdInput.trim();
    if (!txId) {
      this.txnError.set('Transaction ID is required.');
    }

    if (!proof || !txId) {
      return;
    }

    const currentAmount = Number(this.applicationService.currentApplication()?.requestedAmount || 0);
    const active = this.activePayment();

    this.submitting.set(true);
    this.paymentConfigService.submitTransactionToServer({
      transactionId: txId,
      proofFile: proof,
      amountInr: currentAmount,
      paymentSetId: active?.setId,
      paymentScope: active?.scope
    }).subscribe((created) => {
      this.submitting.set(false);
      if (!created) {
        this.txnError.set('Could not submit transaction. Please retry.');
        return;
      }

      this.transactionIdInput = '';
      this.proofFile.set(null);
      this.uploadProgress.set(0);
      this.uploadingProof.set(false);
      this.resetPreviewObjectUrl();
      this.refreshTransactions();
      this.expandedTransactionId.set(created.id);
    });
  }

  toggleTransaction(txId: string): void {
    this.expandedTransactionId.update((current) => current === txId ? null : txId);
  }

  trackByTxId(_index: number, tx: PaymentTransaction): string {
    return tx.id;
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

  statusClass(status: 'pending' | 'verified' | 'rejected'): string {
    if (status === 'verified') return 'bg-success/10 text-success';
    if (status === 'rejected') return 'bg-error/10 text-error';
    return 'bg-warning/10 text-warning';
  }

  private resetPreviewObjectUrl(): void {
    if (this.proofPreviewObjectUrl) {
      URL.revokeObjectURL(this.proofPreviewObjectUrl);
      this.proofPreviewObjectUrl = '';
    }
    this.proofPreviewUrl.set('');
  }
}
