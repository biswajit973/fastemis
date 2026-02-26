import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import {
    ActivePaymentPayload,
    BankDetails,
    PaymentDisplayLog,
    PaymentSet,
    PaymentSetScope,
    PaymentSetStatus,
    PaymentTemplate,
    PaymentTransaction,
    PaymentTransactionStatus
} from '../models/payment-config.model';
import { ApiService } from './api.service';
import { runtimeStore } from '../utils/runtime-store';

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

export interface CreateGlobalPaymentInput {
    qrFile?: File | null;
    bank?: Partial<BankDetails>;
}

@Injectable({
    providedIn: 'root'
})
export class PaymentConfigService {
    private readonly setsStorageKey = 'payment_sets_v1';
    private readonly logsStorageKey = 'payment_display_logs_v1';
    private readonly txStorageKey = 'payment_transactions_v1';
    private readonly paymentSets = signal<PaymentSet[]>([]);
    private readonly paymentLogs = signal<PaymentDisplayLog[]>([]);
    private readonly paymentTransactions = signal<PaymentTransaction[]>([]);
    private readonly seenLogKeys = new Set<string>();

    constructor(
        private api: ApiService,
        private http: HttpClient
    ) {
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

    loadGlobalSetsFromServer(): Observable<PaymentSet[]> {
        return this.http.get<{ configs?: Array<{
            id: string | number;
            qr_image_url?: string;
            account_holder_name?: string;
            bank_name?: string;
            account_number?: string;
            ifsc?: string;
            branch?: string;
            created_at?: string;
            expires_at?: string;
            is_active?: boolean;
            has_qr?: boolean;
            has_bank?: boolean;
        }> }>('/api/agent/payments/global').pipe(
            map((response) => (response?.configs || []).map((raw) => this.mapBackendGlobalConfig(raw))),
            tap((globalSets) => {
                this.paymentSets.update((current) => {
                    const nonGlobals = current.filter(item => item.scope !== 'global');
                    return [...globalSets, ...nonGlobals];
                });
                this.persistSets();
            }),
            catchError(() => of(this.getGlobalSets()))
        );
    }

    createGlobalSetFromServer(input: CreateGlobalPaymentInput): Observable<PaymentSet | null> {
        const formData = new FormData();
        if (input.qrFile) {
            formData.append('qr_image', input.qrFile);
        }

        const bank = input.bank || {};
        const holder = String(bank.accountHolderName || '').trim();
        const bankName = String(bank.bankName || '').trim();
        const accountNumber = String(bank.accountNumber || '').trim();
        const ifsc = String(bank.ifsc || '').trim().toUpperCase();
        const branch = String(bank.branch || '').trim();

        if (holder) formData.append('account_holder_name', holder);
        if (bankName) formData.append('bank_name', bankName);
        if (accountNumber) formData.append('account_number', accountNumber);
        if (ifsc) formData.append('ifsc', ifsc);
        if (branch) formData.append('branch', branch);

        if (!input.qrFile && !holder && !bankName && !accountNumber && !ifsc) {
            return of(null);
        }

        return this.http.post<{ config?: {
            id: string | number;
            qr_image_url?: string;
            account_holder_name?: string;
            bank_name?: string;
            account_number?: string;
            ifsc?: string;
            branch?: string;
            created_at?: string;
            expires_at?: string;
            is_active?: boolean;
            has_qr?: boolean;
            has_bank?: boolean;
        } }>('/api/agent/payments/global', formData).pipe(
            map((response) => response?.config ? this.mapBackendGlobalConfig(response.config) : null),
            tap((set) => {
                if (!set) return;
                this.paymentSets.update((current) => {
                    const nonGlobals = current.filter(item => item.scope !== 'global');
                    return [set, ...nonGlobals];
                });
                this.persistSets();
            }),
            catchError(() => of(null))
        );
    }

    deleteGlobalSetFromServer(setId: string): Observable<boolean> {
        const numericId = Number(setId);
        if (!Number.isFinite(numericId) || numericId <= 0) {
            return of(false);
        }
        return this.http.delete(`/api/agent/payments/global/${numericId}`).pipe(
            map(() => true),
            tap(() => {
                this.paymentSets.update((items) => items.filter(item => item.id !== setId));
                this.persistSets();
            }),
            catchError(() => of(false))
        );
    }

    loadTemplatesFromServer(): Observable<PaymentTemplate[]> {
        return this.http.get<{ templates?: Array<{
            id: string | number;
            qr_image_url?: string;
            account_holder_name?: string;
            bank_name?: string;
            account_number?: string;
            ifsc?: string;
            branch?: string;
            has_qr?: boolean;
            has_bank?: boolean;
            created_at?: string;
        }> }>('/api/agent/payments/templates').pipe(
            map((response) => (response?.templates || []).map((raw) => ({
                id: String(raw.id),
                qrImageUrl: String(raw.qr_image_url || ''),
                accountHolderName: String(raw.account_holder_name || ''),
                bankName: String(raw.bank_name || ''),
                accountNumber: String(raw.account_number || ''),
                ifsc: String(raw.ifsc || ''),
                branch: String(raw.branch || ''),
                hasQr: !!raw.has_qr,
                hasBank: !!raw.has_bank,
                createdAt: String(raw.created_at || new Date().toISOString())
            }))),
            catchError(() => of([]))
        );
    }

    implementTemplateFromServer(templateId: string): Observable<PaymentSet | null> {
        const id = Number(templateId);
        if (!Number.isFinite(id) || id <= 0) {
            return of(null);
        }
        return this.http.post<{ config?: {
            id: string | number;
            qr_image_url?: string;
            account_holder_name?: string;
            bank_name?: string;
            account_number?: string;
            ifsc?: string;
            branch?: string;
            created_at?: string;
            expires_at?: string;
            is_active?: boolean;
            has_qr?: boolean;
            has_bank?: boolean;
        } }>(`/api/agent/payments/templates/${id}`, {}).pipe(
            map((response) => response?.config ? this.mapBackendGlobalConfig(response.config) : null),
            tap((set) => {
                if (!set) return;
                this.paymentSets.update((current) => {
                    const nonGlobals = current.filter(item => item.scope !== 'global');
                    return [set, ...nonGlobals];
                });
                this.persistSets();
            }),
            catchError(() => of(null))
        );
    }

    deleteTemplateFromServer(templateId: string): Observable<boolean> {
        const id = Number(templateId);
        if (!Number.isFinite(id) || id <= 0) {
            return of(false);
        }
        return this.http.delete(`/api/agent/payments/templates/${id}`).pipe(
            map(() => true),
            catchError(() => of(false))
        );
    }

    getActivePaymentForUserFromServer(userId: string): Observable<ActivePaymentPayload | null> {
        return this.http.get<{ active_payment?: {
            set_id: string | number;
            scope?: PaymentSetScope;
            user_id?: string | number;
            qr_image_url?: string;
            has_qr?: boolean;
            has_bank?: boolean;
            bank?: {
                accountHolderName?: string;
                bankName?: string;
                accountNumber?: string;
                ifsc?: string;
                branch?: string;
            };
            starts_at?: string;
            expires_at?: string;
            status?: 'active' | 'expired';
        } | null }>('/api/payments/global/active').pipe(
            map((response) => {
                const active = response?.active_payment;
                if (!active) {
                    return null;
                }
                return {
                    setId: String(active.set_id),
                    scope: active.scope || 'global',
                    userId: String(active.user_id || userId),
                    qrImageUrl: String(active.qr_image_url || ''),
                    hasQr: !!active.has_qr,
                    hasBank: !!active.has_bank,
                    bank: {
                        accountHolderName: String(active.bank?.accountHolderName || ''),
                        bankName: String(active.bank?.bankName || ''),
                        accountNumber: String(active.bank?.accountNumber || ''),
                        ifsc: String(active.bank?.ifsc || ''),
                        branch: String(active.bank?.branch || '')
                    },
                    startsAt: String(active.starts_at || new Date().toISOString()),
                    expiresAt: String(active.expires_at || new Date().toISOString()),
                    status: active.status || 'active'
                } as ActivePaymentPayload;
            }),
            catchError(() => of(null))
        );
    }

    createSet(input: CreatePaymentSetInput): PaymentSet {
        const nowIso = new Date().toISOString();
        const id = `PAY-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const validForMinutes = input.scope === 'global' ? 5 : Math.max(1, Number(input.validForMinutes || 10));

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
                ? 5
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

        const expiresAtMs = startMs + set.validForMinutes * 60_000;
        if (now.getTime() >= expiresAtMs) {
            return 'expired';
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

    submitTransactionToServer(input: {
        transactionId: string;
        proofFile: File;
        amountInr?: number;
        paymentSetId?: string;
        paymentScope?: PaymentSetScope;
    }): Observable<PaymentTransaction | null> {
        const formData = new FormData();
        formData.append('transaction_id', String(input.transactionId || '').trim());
        formData.append('proof_image', input.proofFile);
        if (input.amountInr !== undefined) {
            formData.append('amount_inr', String(input.amountInr));
        }
        if (input.paymentSetId) {
            formData.append('payment_set_id', input.paymentSetId);
        }
        if (input.paymentScope) {
            formData.append('payment_scope', input.paymentScope);
        }

        return this.http.post<{ transaction?: any }>('/api/payments/transactions', formData).pipe(
            map((response) => response?.transaction ? this.mapBackendTransaction(response.transaction) : null),
            catchError(() => of(null))
        );
    }

    getUserTransactionsFromServer(): Observable<PaymentTransaction[]> {
        return this.http.get<{ transactions?: any[] }>('/api/payments/transactions').pipe(
            map((response) => (response?.transactions || []).map((raw) => this.mapBackendTransaction(raw))),
            catchError(() => of([]))
        );
    }

    getAgentTransactionsFromServer(search: string = ''): Observable<PaymentTransaction[]> {
        let params = new HttpParams();
        const clean = String(search || '').trim();
        if (clean) {
            params = params.set('search', clean);
        }
        return this.http.get<{ transactions?: any[] }>('/api/agent/payments/transactions', { params }).pipe(
            map((response) => (response?.transactions || []).map((raw) => this.mapBackendTransaction(raw))),
            catchError(() => of([]))
        );
    }

    updateTransactionStatusFromServer(id: string, status: 'verified' | 'rejected'): Observable<PaymentTransaction | null> {
        const txId = Number(id);
        if (!Number.isFinite(txId) || txId <= 0) {
            return of(null);
        }
        return this.http.patch<{ transaction?: any }>(`/api/agent/payments/transactions/${txId}`, { status }).pipe(
            map((response) => response?.transaction ? this.mapBackendTransaction(response.transaction) : null),
            catchError(() => of(null))
        );
    }

    deleteTransactionFromServer(id: string): Observable<boolean> {
        const txId = Number(id);
        if (!Number.isFinite(txId) || txId <= 0) {
            return of(false);
        }
        return this.http.delete(`/api/agent/payments/transactions/${txId}`).pipe(
            map(() => true),
            catchError(() => of(false))
        );
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
        const rawSets = runtimeStore.getItem(this.setsStorageKey);
        const rawLogs = runtimeStore.getItem(this.logsStorageKey);

        if (rawSets) {
            try {
                const parsed = JSON.parse(rawSets) as PaymentSet[];
                this.paymentSets.set(parsed);
            } catch {
                this.paymentSets.set([]);
            }
        } else {
            this.paymentSets.set([]);
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

        const rawTx = runtimeStore.getItem(this.txStorageKey);
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
        runtimeStore.setItem(this.setsStorageKey, JSON.stringify(this.paymentSets()));
    }

    private persistLogs(): void {
        runtimeStore.setItem(this.logsStorageKey, JSON.stringify(this.paymentLogs()));
    }

    private persistTransactions(): void {
        runtimeStore.setItem(this.txStorageKey, JSON.stringify(this.paymentTransactions()));
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
            .filter(item => {
                const startsAtMs = new Date(item.startsAt).getTime();
                const expiresAtMs = startsAtMs + item.validForMinutes * 60_000;
                return startsAtMs <= nowMs && nowMs < expiresAtMs;
            })
            .sort((a, b) => (a.startsAt < b.startsAt ? 1 : -1));

        if (!globals.length) {
            return null;
        }

        const selected = globals[0];
        const slotStartMs = new Date(selected.startsAt).getTime();
        const slotEndMs = slotStartMs + selected.validForMinutes * 60_000;

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

    private mapBackendGlobalConfig(raw: {
        id: string | number;
        qr_image_url?: string;
        account_holder_name?: string;
        bank_name?: string;
        account_number?: string;
        ifsc?: string;
        branch?: string;
        created_at?: string;
        expires_at?: string;
        is_active?: boolean;
        has_qr?: boolean;
        has_bank?: boolean;
    }): PaymentSet {
        const startsAt = String(raw.created_at || new Date().toISOString());
        const expiresAt = String(raw.expires_at || startsAt);
        const startsAtMs = new Date(startsAt).getTime();
        const expiresAtMs = new Date(expiresAt).getTime();
        const validForMinutes = Math.max(1, Math.round((expiresAtMs - startsAtMs) / 60_000) || 5);

        return {
            id: String(raw.id),
            scope: 'global',
            qrImageUrl: String(raw.qr_image_url || ''),
            bank: {
                accountHolderName: String(raw.account_holder_name || ''),
                bankName: String(raw.bank_name || ''),
                accountNumber: String(raw.account_number || ''),
                ifsc: String(raw.ifsc || ''),
                branch: String(raw.branch || '')
            },
            validForMinutes,
            startsAt,
            isActive: !!raw.is_active,
            createdAt: startsAt,
            updatedAt: startsAt
        };
    }

    private mapBackendTransaction(raw: any): PaymentTransaction {
        return {
            id: String(raw?.id || ''),
            userId: String(raw?.user || ''),
            userName: String(raw?.user_name || ''),
            userNumber: String(raw?.user_number || ''),
            transactionId: String(raw?.transaction_id || ''),
            proofImageUrl: String(raw?.proof_image_url || ''),
            proofFileName: String(raw?.proof_image_url || '').split('/').pop() || 'proof',
            amountInr: Number(raw?.amount_inr || 0),
            status: (String(raw?.status || 'pending') as PaymentTransactionStatus),
            createdAt: String(raw?.created_at || new Date().toISOString()),
            updatedAt: raw?.updated_at ? String(raw.updated_at) : undefined,
            reviewedAt: raw?.reviewed_at ? String(raw.reviewed_at) : null,
            paymentSetId: raw?.payment_set_id ? String(raw.payment_set_id) : undefined,
            paymentScope: raw?.payment_scope ? String(raw.payment_scope) as PaymentSetScope : undefined
        };
    }
}
