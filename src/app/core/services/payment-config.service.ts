import { Injectable, signal } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
    ActivePaymentPayload,
    BankDetails,
    PaymentDisplayLog,
    PaymentSet,
    PaymentSetScope,
    PaymentSetStatus,
    PaymentTransaction,
    PaymentTransactionStatus
} from '../models/payment-config.model';
import { ApiService } from './api.service';

export interface CreatePaymentSetInput {
    scope: PaymentSetScope;
    userId?: string;
    qrImageUrl: string;
    bank: BankDetails;
    validForMinutes: number;
    startsAt: string;
    isActive?: boolean;
}

export interface SubmitTransactionInput {
    userId: string;
    transactionId: string;
    proofImageUrl: string;
    proofFileName: string;
    amountInr: number;
    paymentSetId?: string;
    paymentScope?: PaymentSetScope;
}

@Injectable({
    providedIn: 'root'
})
export class PaymentConfigService {
    private readonly setsStorageKey = 'payment_sets_v1';
    private readonly logsStorageKey = 'payment_display_logs_v1';
    private readonly txStorageKey = 'payment_transactions_v1';
    private readonly slotMs = 10 * 60 * 1000;

    private readonly paymentSets = signal<PaymentSet[]>([]);
    private readonly paymentLogs = signal<PaymentDisplayLog[]>([]);
    private readonly paymentTransactions = signal<PaymentTransaction[]>([]);
    private readonly seenLogKeys = new Set<string>();

    constructor(private api: ApiService) {
        this.hydrate();
    }

    getGlobalSets(): PaymentSet[] {
        return this.paymentSets()
            .filter(item => item.scope === 'global')
            .sort((a, b) => (a.startsAt < b.startsAt ? 1 : -1));
    }

    getUserSets(userId: string): PaymentSet[] {
        return this.paymentSets()
            .filter(item => item.scope === 'user' && item.userId === userId)
            .sort((a, b) => (a.startsAt < b.startsAt ? 1 : -1));
    }

    createSet(input: CreatePaymentSetInput): PaymentSet {
        const nowIso = new Date().toISOString();
        const id = `PAY-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const validForMinutes = input.scope === 'global' ? 10 : Math.max(1, Number(input.validForMinutes || 10));

        const nextSet: PaymentSet = {
            id,
            scope: input.scope,
            userId: input.scope === 'user' ? input.userId : undefined,
            qrImageUrl: input.qrImageUrl.trim(),
            bank: this.normalizeBank(input.bank),
            validForMinutes,
            startsAt: new Date(input.startsAt).toISOString(),
            isActive: input.isActive !== false,
            createdAt: nowIso,
            updatedAt: nowIso
        };

        this.paymentSets.update(items => [nextSet, ...items]);
        this.persistSets();
        return nextSet;
    }

    updateSet(id: string, patch: Partial<CreatePaymentSetInput>): PaymentSet | null {
        let updated: PaymentSet | null = null;

        this.paymentSets.update(items => items.map(item => {
            if (item.id !== id) {
                return item;
            }

            const nextScope = patch.scope || item.scope;
            const nextValid = nextScope === 'global'
                ? 10
                : Math.max(1, Number(patch.validForMinutes ?? item.validForMinutes));

            const next: PaymentSet = {
                ...item,
                scope: nextScope,
                userId: nextScope === 'user' ? (patch.userId ?? item.userId) : undefined,
                qrImageUrl: patch.qrImageUrl !== undefined ? patch.qrImageUrl.trim() : item.qrImageUrl,
                bank: patch.bank ? this.normalizeBank(patch.bank) : item.bank,
                validForMinutes: nextValid,
                startsAt: patch.startsAt ? new Date(patch.startsAt).toISOString() : item.startsAt,
                isActive: patch.isActive !== undefined ? !!patch.isActive : item.isActive,
                updatedAt: new Date().toISOString()
            };

            updated = next;
            return next;
        }));

        this.persistSets();
        return updated;
    }

    toggleSet(id: string, isActive: boolean): void {
        this.paymentSets.update(items => items.map(item => item.id === id
            ? { ...item, isActive, updatedAt: new Date().toISOString() }
            : item));
        this.persistSets();
    }

    deleteSet(id: string): void {
        this.paymentSets.update(items => items.filter(item => item.id !== id));
        this.persistSets();
    }

    resolveActivePaymentForUser(userId: string, now: Date = new Date()): ActivePaymentPayload | null {
        const nowMs = now.getTime();
        const activeUserSet = this.resolveActiveUserSpecific(userId, nowMs);

        if (activeUserSet) {
            const startsAtMs = new Date(activeUserSet.startsAt).getTime();
            const expiresAtMs = startsAtMs + activeUserSet.validForMinutes * 60_000;
            return {
                setId: activeUserSet.id,
                scope: 'user',
                userId,
                qrImageUrl: activeUserSet.qrImageUrl,
                bank: activeUserSet.bank,
                startsAt: new Date(startsAtMs).toISOString(),
                expiresAt: new Date(expiresAtMs).toISOString(),
                status: nowMs < expiresAtMs ? 'active' : 'expired'
            };
        }

        const globalActive = this.resolveActiveGlobal(nowMs);
        if (!globalActive) {
            return null;
        }

        return {
            setId: globalActive.set.id,
            scope: 'global',
            userId,
            qrImageUrl: globalActive.set.qrImageUrl,
            bank: globalActive.set.bank,
            startsAt: new Date(globalActive.slotStartMs).toISOString(),
            expiresAt: new Date(globalActive.slotEndMs).toISOString(),
            status: nowMs < globalActive.slotEndMs ? 'active' : 'expired'
        };
    }

    getSetStatus(set: PaymentSet, now: Date = new Date()): PaymentSetStatus {
        if (!set.isActive) {
            return 'inactive';
        }

        const startMs = new Date(set.startsAt).getTime();
        if (now.getTime() < startMs) {
            return 'scheduled';
        }

        if (set.scope === 'user') {
            const expiresAtMs = startMs + set.validForMinutes * 60_000;
            if (now.getTime() >= expiresAtMs) {
                return 'expired';
            }
        }

        return 'active';
    }

    isGlobalSetSelectedNow(setId: string, now: Date = new Date()): boolean {
        const selected = this.resolveActiveGlobal(now.getTime());
        return selected?.set.id === setId;
    }

    logDisplay(payload: ActivePaymentPayload, userId: string): void {
        const key = `${userId}|${payload.setId}|${payload.startsAt}|${payload.expiresAt}`;
        if (this.seenLogKeys.has(key)) {
            return;
        }

        const alreadyLogged = this.paymentLogs().some(log =>
            log.userId === userId &&
            log.setId === payload.setId &&
            log.expiresAt === payload.expiresAt &&
            log.context === 'send_payments_tab'
        );
        if (alreadyLogged) {
            this.seenLogKeys.add(key);
            return;
        }

        const nextLog: PaymentDisplayLog = {
            id: `LOG-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            userId,
            setId: payload.setId,
            scope: payload.scope,
            shownAt: new Date().toISOString(),
            expiresAt: payload.expiresAt,
            context: 'send_payments_tab'
        };

        this.paymentLogs.update(items => [nextLog, ...items].slice(0, 1200));
        this.seenLogKeys.add(key);
        this.persistLogs();
    }

    getDisplayLogs(userId?: string): PaymentDisplayLog[] {
        const all = this.paymentLogs();
        if (!userId) {
            return all;
        }
        return all.filter(item => item.userId === userId);
    }

    submitTransaction(input: SubmitTransactionInput): PaymentTransaction {
        const trimmedTxn = input.transactionId.trim();
        const duplicate = this.paymentTransactions().some(item =>
            item.userId === input.userId &&
            item.transactionId.toLowerCase() === trimmedTxn.toLowerCase()
        );
        if (duplicate) {
            throw new Error('Transaction ID already exists for this user.');
        }

        const tx: PaymentTransaction = {
            id: `TX-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            userId: input.userId,
            transactionId: trimmedTxn,
            proofImageUrl: input.proofImageUrl,
            proofFileName: input.proofFileName.trim(),
            amountInr: Math.max(0, Math.floor(input.amountInr || 0)),
            status: 'pending',
            createdAt: new Date().toISOString(),
            paymentSetId: input.paymentSetId,
            paymentScope: input.paymentScope
        };

        this.paymentTransactions.update(items => [tx, ...items]);
        this.persistTransactions();
        return tx;
    }

    getTransactions(userId: string): PaymentTransaction[] {
        return this.paymentTransactions()
            .filter(item => item.userId === userId)
            .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    }

    updateTransactionStatus(id: string, status: PaymentTransactionStatus): void {
        this.paymentTransactions.update(items => items.map(item => item.id === id
            ? { ...item, status }
            : item));
        this.persistTransactions();
    }

    // API-adapter signatures for future backend wiring.
    getActivePaymentFromApi(userId: string): Observable<ActivePaymentPayload> {
        const params = new HttpParams().set('userId', userId);
        return this.api.get<ActivePaymentPayload>('/payments/active', params);
    }

    getPaymentSetsFromApi(scope: PaymentSetScope, userId?: string): Observable<PaymentSet[]> {
        let params = new HttpParams().set('scope', scope);
        if (userId) {
            params = params.set('userId', userId);
        }
        return this.api.get<PaymentSet[]>('/payments/sets', params);
    }

    createPaymentSetViaApi(payload: CreatePaymentSetInput): Observable<PaymentSet> {
        return this.api.post<PaymentSet>('/payments/sets', payload as unknown as Record<string, unknown>);
    }

    updatePaymentSetViaApi(id: string, patch: Partial<CreatePaymentSetInput>): Observable<PaymentSet> {
        return this.api.put<PaymentSet>(`/payments/sets/${id}`, patch as unknown as Record<string, unknown>);
    }

    togglePaymentSetViaApi(id: string, isActive: boolean): Observable<{ success: boolean }> {
        return this.api.put<{ success: boolean }>(`/payments/sets/${id}/activate`, { isActive });
    }

    deletePaymentSetViaApi(id: string): Observable<{ success: boolean }> {
        return this.api.delete<{ success: boolean }>(`/payments/sets/${id}`);
    }

    logDisplayViaApi(payload: PaymentDisplayLog): Observable<{ success: boolean }> {
        return this.api.post<{ success: boolean }>('/payments/display-logs', payload as unknown as Record<string, unknown>);
    }

    submitTransactionViaApi(payload: SubmitTransactionInput): Observable<PaymentTransaction> {
        return this.api.post<PaymentTransaction>('/payments/transactions', payload as unknown as Record<string, unknown>);
    }

    getTransactionsViaApi(userId: string): Observable<PaymentTransaction[]> {
        const params = new HttpParams().set('userId', userId);
        return this.api.get<PaymentTransaction[]>('/payments/transactions', params);
    }

    updateTransactionStatusViaApi(id: string, status: PaymentTransactionStatus): Observable<{ success: boolean }> {
        return this.api.put<{ success: boolean }>(`/payments/transactions/${id}/status`, { status });
    }

    private hydrate(): void {
        const rawSets = localStorage.getItem(this.setsStorageKey);
        const rawLogs = localStorage.getItem(this.logsStorageKey);

        if (rawSets) {
            try {
                const parsed = JSON.parse(rawSets) as PaymentSet[];
                this.paymentSets.set(parsed);
            } catch {
                this.paymentSets.set(this.getDefaultSets());
            }
        } else {
            this.paymentSets.set(this.getDefaultSets());
        }

        if (rawLogs) {
            try {
                this.paymentLogs.set(JSON.parse(rawLogs) as PaymentDisplayLog[]);
            } catch {
                this.paymentLogs.set([]);
            }
        } else {
            this.paymentLogs.set([]);
        }

        const rawTx = localStorage.getItem(this.txStorageKey);
        if (rawTx) {
            try {
                this.paymentTransactions.set(JSON.parse(rawTx) as PaymentTransaction[]);
            } catch {
                this.paymentTransactions.set([]);
            }
        } else {
            this.paymentTransactions.set([]);
        }

        this.persistSets();
        this.persistLogs();
        this.persistTransactions();
    }

    private persistSets(): void {
        localStorage.setItem(this.setsStorageKey, JSON.stringify(this.paymentSets()));
    }

    private persistLogs(): void {
        localStorage.setItem(this.logsStorageKey, JSON.stringify(this.paymentLogs()));
    }

    private persistTransactions(): void {
        localStorage.setItem(this.txStorageKey, JSON.stringify(this.paymentTransactions()));
    }

    private resolveActiveUserSpecific(userId: string, nowMs: number): PaymentSet | null {
        const candidates = this.paymentSets()
            .filter(item => item.scope === 'user' && item.userId === userId && item.isActive)
            .filter(item => {
                const startsAtMs = new Date(item.startsAt).getTime();
                const expiresAtMs = startsAtMs + item.validForMinutes * 60_000;
                return startsAtMs <= nowMs && nowMs < expiresAtMs;
            })
            .sort((a, b) => (a.startsAt < b.startsAt ? 1 : -1));

        return candidates[0] || null;
    }

    private resolveActiveGlobal(nowMs: number): { set: PaymentSet; slotStartMs: number; slotEndMs: number } | null {
        const globals = this.paymentSets()
            .filter(item => item.scope === 'global' && item.isActive)
            .filter(item => new Date(item.startsAt).getTime() <= nowMs)
            .sort((a, b) => (a.startsAt < b.startsAt ? -1 : 1));

        if (!globals.length) {
            return null;
        }

        const anchor = new Date(globals[0].startsAt).getTime();
        const slotIndex = Math.floor((nowMs - anchor) / this.slotMs);
        const selected = globals[slotIndex % globals.length];
        const slotStartMs = anchor + slotIndex * this.slotMs;
        const slotEndMs = slotStartMs + this.slotMs;

        return { set: selected, slotStartMs, slotEndMs };
    }

    private normalizeBank(bank: BankDetails): BankDetails {
        return {
            accountHolderName: bank.accountHolderName.trim(),
            bankName: bank.bankName.trim(),
            accountNumber: bank.accountNumber.trim(),
            ifsc: bank.ifsc.trim().toUpperCase(),
            branch: bank.branch?.trim() || undefined
        };
    }

    private getDefaultSets(): PaymentSet[] {
        const now = Date.now();
        const createdAt = new Date(now).toISOString();
        const firstStart = new Date(now - 40 * 60_000).toISOString();
        const secondStart = new Date(now - 30 * 60_000).toISOString();

        return [
            {
                id: 'PAY-DEFAULT-1',
                scope: 'global',
                qrImageUrl: this.makeDataQr('Global-A'),
                bank: {
                    accountHolderName: 'FastEMIs Collections A',
                    bankName: 'HDFC Bank',
                    accountNumber: '901234567890',
                    ifsc: 'HDFC0001234',
                    branch: 'BKC Mumbai'
                },
                validForMinutes: 10,
                startsAt: firstStart,
                isActive: true,
                createdAt,
                updatedAt: createdAt
            },
            {
                id: 'PAY-DEFAULT-2',
                scope: 'global',
                qrImageUrl: this.makeDataQr('Global-B'),
                bank: {
                    accountHolderName: 'FastEMIs Collections B',
                    bankName: 'ICICI Bank',
                    accountNumber: '902345678901',
                    ifsc: 'ICIC0000028',
                    branch: 'Andheri East'
                },
                validForMinutes: 10,
                startsAt: secondStart,
                isActive: true,
                createdAt,
                updatedAt: createdAt
            }
        ];
    }

    private makeDataQr(label: string): string {
        const safeLabel = label.replace(/[^a-zA-Z0-9-]/g, '');
        const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><rect width='100%' height='100%' fill='#ffffff'/><rect x='20' y='20' width='200' height='200' fill='#111827'/><rect x='40' y='40' width='160' height='160' fill='#ffffff'/><rect x='60' y='60' width='120' height='120' fill='#111827'/><text x='120' y='224' font-size='16' text-anchor='middle' fill='#111827'>${safeLabel}</text></svg>`;
        return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }
}
