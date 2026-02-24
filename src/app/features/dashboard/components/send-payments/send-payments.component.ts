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

    <main class="pt-20 md:pt-24 pb-24 md:pb-12 md:pl-64 min-h-screen bg-surface-2">
      <div class="container max-w-5xl py-6">
        <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 class="text-2xl md:text-3xl font-bold text-primary mb-1">Send Payments</h1>
            <p class="text-sm text-secondary">Pay using QR code or bank account details shown below.</p>
          </div>

          <div class="flex items-center gap-2">
            <button
              (click)="refreshPaymentDetails()"
              class="px-4 py-2 rounded-lg border border-border bg-surface text-sm font-medium text-primary hover:border-primary transition-colors">
              Refresh
            </button>
            <a routerLink="/dashboard" class="px-4 py-2 rounded-lg border border-border bg-surface text-sm font-medium text-primary no-underline hover:border-primary transition-colors">
              Back
            </a>
          </div>
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

            <div class="border border-border rounded-xl bg-surface-2 p-4 flex items-center justify-center">
              <img [src]="activePayment()!.qrImageUrl" alt="Payment QR code" class="w-full max-w-[260px] aspect-square object-contain rounded-lg border border-border bg-white p-2">
            </div>

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
            <div class="space-y-3 text-sm">
              <div class="rounded-lg border border-border bg-surface-2 p-3">
                <div class="text-xs text-secondary mb-1">Account Holder</div>
                <div class="font-medium text-primary">{{ activePayment()!.bank.accountHolderName }}</div>
              </div>
              <div class="rounded-lg border border-border bg-surface-2 p-3">
                <div class="text-xs text-secondary mb-1">Bank Name</div>
                <div class="font-medium text-primary">{{ activePayment()!.bank.bankName }}</div>
              </div>
              <div class="rounded-lg border border-border bg-surface-2 p-3">
                <div class="text-xs text-secondary mb-1">Account Number</div>
                <div class="font-medium text-primary font-mono tracking-wide">{{ activePayment()!.bank.accountNumber }}</div>
              </div>
              <div class="rounded-lg border border-border bg-surface-2 p-3">
                <div class="text-xs text-secondary mb-1">IFSC</div>
                <div class="font-medium text-primary font-mono">{{ activePayment()!.bank.ifsc }}</div>
              </div>
              <div *ngIf="activePayment()!.bank.branch" class="rounded-lg border border-border bg-surface-2 p-3">
                <div class="text-xs text-secondary mb-1">Branch</div>
                <div class="font-medium text-primary">{{ activePayment()!.bank.branch }}</div>
              </div>
            </div>
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
            <span class="text-xs text-secondary">{{ transactions().length }} record(s)</span>
          </div>

          <div *ngIf="transactions().length > 0; else noHistory" class="space-y-3">
            <article *ngFor="let tx of transactions()" class="border border-border rounded-xl bg-surface-2 overflow-hidden">
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
                      <div class="text-xs text-secondary mb-1">Amount</div>
                      <div class="font-medium text-primary">{{ formatInr(tx.amountInr) }}</div>
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
            <p class="text-sm text-secondary">
              Payment details are being updated. Please refresh or try again in a few minutes.
            </p>
          </section>
        </ng-template>
      </div>
    </main>
  `
})
export class SendPaymentsComponent implements OnInit, OnDestroy {
    activePayment = signal<ActivePaymentPayload | null>(null);
    transactions = signal<PaymentTransaction[]>([]);
    expandedTransactionId = signal<string | null>(null);

    uploadingProof = signal<boolean>(false);
    uploadProgress = signal<number>(0);
    proofDataUrl = signal<string>('');
    proofFileName = signal<string>('');
    submitting = signal<boolean>(false);

    proofError = signal<string>('');
    txnError = signal<string>('');

    transactionIdInput = '';
    private refreshTimer: any;

    constructor(
        private authService: AuthService,
        private paymentConfigService: PaymentConfigService,
        private applicationService: ApplicationService
    ) { }

    ngOnInit(): void {
        this.refreshPaymentDetails();
        this.refreshTransactions();
        this.refreshTimer = setInterval(() => this.refreshPaymentDetails(), 30_000);
    }

    ngOnDestroy(): void {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
    }

    refreshPaymentDetails(): void {
        const userId = this.authService.currentUserSignal()?.id;
        if (!userId) {
            this.activePayment.set(null);
            return;
        }

        const payload = this.paymentConfigService.resolveActivePaymentForUser(userId);
        this.activePayment.set(payload);

        if (payload) {
            this.paymentConfigService.logDisplay(payload, userId);
        }
    }

    onCountdownExpired(): void {
        this.refreshPaymentDetails();
    }

    sourceLabel(scope: 'global' | 'user'): string {
        return scope === 'user' ? 'User-specific' : 'Global';
    }

    onProofSelected(file: File): void {
        this.proofError.set('');
        this.uploadingProof.set(true);
        this.uploadProgress.set(0);
        this.proofDataUrl.set('');
        this.proofFileName.set(file.name);

        const interval = setInterval(() => {
            this.uploadProgress.update(current => {
                if (current >= 100) {
                    clearInterval(interval);
                    this.uploadingProof.set(false);
                    return 100;
                }
                return current + 25;
            });
        }, 140);

        const reader = new FileReader();
        reader.onload = () => {
            this.proofDataUrl.set(String(reader.result || ''));
        };
        reader.readAsDataURL(file);
    }

    submitTransaction(): void {
        this.proofError.set('');
        this.txnError.set('');

        const userId = this.authService.currentUserSignal()?.id;
        if (!userId) {
            return;
        }

        const txId = this.transactionIdInput.trim();
        const active = this.activePayment();
        if (!active) {
            this.txnError.set('No active payment details available right now.');
            return;
        }
        if (!this.proofDataUrl()) {
            this.proofError.set('Transaction screenshot is required.');
        }
        if (!txId) {
            this.txnError.set('Transaction ID is required.');
        }
        if (this.proofError() || this.txnError()) {
            return;
        }

        this.submitting.set(true);
        try {
            const currentAmount = this.applicationService.currentApplication()?.payment_details?.amount || 0;
            this.paymentConfigService.submitTransaction({
                userId,
                transactionId: txId,
                proofImageUrl: this.proofDataUrl(),
                proofFileName: this.proofFileName() || 'payment-proof.png',
                amountInr: currentAmount,
                paymentSetId: active?.setId,
                paymentScope: active?.scope
            });

            this.transactionIdInput = '';
            this.proofDataUrl.set('');
            this.proofFileName.set('');
            this.uploadProgress.set(0);
            this.uploadingProof.set(false);
            this.refreshTransactions();
            if (this.transactions().length > 0) {
                this.expandedTransactionId.set(this.transactions()[0].id);
            }
        } catch (e: any) {
            this.txnError.set(e?.message || 'Could not submit transaction.');
        } finally {
            this.submitting.set(false);
        }
    }

    toggleTransaction(txId: string): void {
        this.expandedTransactionId.update(current => current === txId ? null : txId);
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

    private refreshTransactions(): void {
        const userId = this.authService.currentUserSignal()?.id;
        if (!userId) {
            this.transactions.set([]);
            return;
        }
        this.transactions.set(this.paymentConfigService.getTransactions(userId));
    }
}
