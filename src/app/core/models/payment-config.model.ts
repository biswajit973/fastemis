export type PaymentSetScope = 'global' | 'user';
export type PaymentSetStatus = 'scheduled' | 'active' | 'expired' | 'inactive';

export interface BankDetails {
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    ifsc: string;
    branch?: string;
}

export interface PaymentSet {
    id: string;
    scope: PaymentSetScope;
    userId?: string;
    qrImageUrl: string;
    bank: BankDetails;
    validForMinutes: number;
    startsAt: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ActivePaymentPayload {
    setId: string;
    scope: PaymentSetScope;
    userId: string;
    qrImageUrl: string;
    bank: BankDetails;
    hasQr?: boolean;
    hasBank?: boolean;
    startsAt: string;
    expiresAt: string;
    status: 'active' | 'expired';
}

export interface PaymentDisplayLog {
    id: string;
    userId: string;
    setId: string;
    scope: PaymentSetScope;
    shownAt: string;
    expiresAt: string;
    context: 'send_payments_tab';
}

export type PaymentTransactionStatus = 'pending' | 'verified' | 'rejected';

export interface PaymentTransaction {
    id: string;
    userId: string;
    userName?: string;
    userNumber?: string;
    transactionId: string;
    proofImageUrl: string;
    proofFileName: string;
    amountInr: number;
    status: PaymentTransactionStatus;
    createdAt: string;
    updatedAt?: string;
    reviewedAt?: string | null;
    paymentSetId?: string;
    paymentScope?: PaymentSetScope;
}

export interface PaymentTemplate {
    id: string;
    qrImageUrl: string;
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    ifsc: string;
    branch?: string;
    hasQr: boolean;
    hasBank: boolean;
    createdAt: string;
}
