export interface PaymentDetails {
    applicationId: string;
    amount: number;
    expiresAt: string; // ISO String mapping to 5 mins from issuance
    bankTransfer: {
        accountName: string;
        accountNo: string;
        ifsc: string;
    };
    upi: {
        id: string;
    };
}
