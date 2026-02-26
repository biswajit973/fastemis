import { Injectable, signal } from '@angular/core';
import { ApplicationStatus } from '../models/application.model';
import { AdminService } from './admin.service';
import { ChatService } from './chat.service';
import { runtimeStore } from '../utils/runtime-store';

export interface AgentUploadedMedia {
    id: string;
    type: 'image' | 'video' | 'attachment';
    name: string;
    url?: string;
    uploadedBy: 'user' | 'agent';
    uploadedAt: string;
}

export interface AgentPaymentDetails {
    salaryInr: number;
    bankName: string;
    accountMasked: string;
    ifsc: string;
    paymentRoutingId: string;
    advanceEmiInr: number;
    lastPaymentRef?: string;
    lastPaymentAt?: string;
}

export interface UserStatusUpdate {
    id: string;
    heading: string;
    details: string;
    badge: string;
    updatedAt: string;
}

export interface AgentUserProfile {
    id: string;
    fullName: string;
    email: string;
    mobile: string;
    taxId: string;
    nationalId: string;
    dob: string;
    address: string;
    occupation: string;
    maritalStatus: 'married' | 'unmarried';
    spouseOccupation?: string;
    employmentType: 'salaried' | 'self-employed' | 'student';
    lastLoginAt: string;
    isDisabled: boolean;
    notice?: string | null;
    statusUpdates: UserStatusUpdate[];
    payment: AgentPaymentDetails;
    uploadedMedia: AgentUploadedMedia[];
}

export interface AgentApplicationSummary {
    applicationId: string;
    userId: string;
    requestedAmount: number;
    receivedAt: string;
    status: ApplicationStatus;
    rejectReason?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AgentDataService {
    private readonly usersStorageKey = 'agent_users_v1';
    private readonly applicationsStorageKey = 'agent_applications_v1';

    private readonly usersMap = signal<Record<string, AgentUserProfile>>({});
    private readonly applications = signal<AgentApplicationSummary[]>([]);

    constructor(
        private adminService: AdminService,
        private chatService: ChatService
    ) {
        this.hydrate();
    }

    private hydrate() {
        const rawUsers = runtimeStore.getItem(this.usersStorageKey);
        const rawApplications = runtimeStore.getItem(this.applicationsStorageKey);

        if (rawUsers && rawApplications) {
            try {
                this.usersMap.set(JSON.parse(rawUsers));
                this.applications.set(JSON.parse(rawApplications));
                this.syncUserFlagsFromStorage();
                return;
            } catch (e) {
                // fallback to default data
            }
        }

        this.usersMap.set(this.defaultUsers());
        this.applications.set(this.defaultApplications());
        this.syncUserFlagsFromStorage();
        this.persist();
    }

    private persist() {
        runtimeStore.setItem(this.usersStorageKey, JSON.stringify(this.usersMap()));
        runtimeStore.setItem(this.applicationsStorageKey, JSON.stringify(this.applications()));
    }

    private syncUserFlagsFromStorage() {
        const users = this.usersMap();
        const next: Record<string, AgentUserProfile> = {};

        Object.keys(users).forEach(userId => {
            const user = users[userId];
            next[userId] = {
                ...user,
                isDisabled: !!runtimeStore.getItem(`disabled_${userId}`) || user.isDisabled,
                notice: runtimeStore.getItem(`global_marquee_notice_${userId}`) || user.notice || null,
                statusUpdates: user.statusUpdates || []
            };
        });

        this.usersMap.set(next);
    }

    getApplications(): AgentApplicationSummary[] {
        const users = this.usersMap();
        return this.applications().filter(app => !!users[app.userId]);
    }

    getApplicationById(applicationId: string): AgentApplicationSummary | null {
        return this.getApplications().find(app => app.applicationId === applicationId) || null;
    }

    getUserById(userId: string): AgentUserProfile | null {
        return this.usersMap()[userId] || null;
    }

    getStatusUpdates(userId: string): UserStatusUpdate[] {
        return this.getUserById(userId)?.statusUpdates || [];
    }

    updateStatus(applicationId: string, status: ApplicationStatus) {
        this.applications.update(apps => apps.map(app => {
            if (app.applicationId === applicationId) {
                return {
                    ...app,
                    status,
                    rejectReason: status === ApplicationStatus.REJECTED ? app.rejectReason : undefined
                };
            }
            return app;
        }));
        this.persist();
    }

    quickAction(applicationId: string, action: 'approve' | 'reject' | 'hold') {
        const app = this.getApplicationById(applicationId);
        if (!app) return;

        if (action === 'approve') {
            this.updateStatus(applicationId, ApplicationStatus.COMPLETED);
            this.addStatusUpdate(app.userId, {
                heading: 'Application Approved',
                details: 'Your BGV has been approved and onboarding is completed.',
                badge: 'Completed'
            }, true);
            return;
        }

        if (action === 'reject') {
            this.rejectBGV(applicationId, 'Application rejected by agent review.');
            this.addStatusUpdate(app.userId, {
                heading: 'Application Rejected',
                details: 'Your profile did not pass final verification checks.',
                badge: 'Rejected'
            }, true);
            return;
        }

        this.updateStatus(applicationId, ApplicationStatus.BGV_IN_PROGRESS);
        this.addStatusUpdate(app.userId, {
            heading: 'Application On Hold',
            details: 'Your application is currently on hold for manual verification.',
            badge: 'Hold'
        }, true);
    }

    advanceStatus(applicationId: string) {
        const flow: ApplicationStatus[] = [
            ApplicationStatus.NEW_UNPAID,
            ApplicationStatus.KYC_PAID,
            ApplicationStatus.AGREEMENT_PENDING,
            ApplicationStatus.AGREEMENT_DONE,
            ApplicationStatus.BGV_IN_PROGRESS,
            ApplicationStatus.COMPLETED
        ];

        const app = this.getApplicationById(applicationId);
        if (!app || app.status === ApplicationStatus.REJECTED || app.status === ApplicationStatus.COMPLETED) {
            return;
        }

        const idx = flow.indexOf(app.status);
        if (idx >= 0 && idx < flow.length - 1) {
            this.updateStatus(applicationId, flow[idx + 1]);
        }
    }

    approveBGV(applicationId: string) {
        this.applications.update(apps => apps.map(app => app.applicationId === applicationId
            ? { ...app, status: ApplicationStatus.COMPLETED, rejectReason: undefined }
            : app));
        this.persist();
    }

    rejectBGV(applicationId: string, reason: string) {
        this.applications.update(apps => apps.map(app => app.applicationId === applicationId
            ? { ...app, status: ApplicationStatus.REJECTED, rejectReason: reason }
            : app));
        this.persist();
    }

    addStatusUpdate(
        userId: string,
        payload: { heading: string; details: string; badge: string },
        replaceOldestIfFull: boolean = false
    ): { ok: boolean; error?: string } {
        const user = this.getUserById(userId);
        if (!user) {
            return { ok: false, error: 'User not found' };
        }

        const heading = payload.heading.trim();
        const details = payload.details.trim();
        const badge = payload.badge.trim();

        if (!heading || !details || !badge) {
            return { ok: false, error: 'Heading, details, and badge are required' };
        }

        const updates = [...user.statusUpdates];
        if (updates.length >= 2 && !replaceOldestIfFull) {
            return { ok: false, error: 'Maximum 2 statuses allowed per user' };
        }

        if (updates.length >= 2 && replaceOldestIfFull) {
            updates.shift();
        }

        updates.push({
            id: 'STS-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            heading,
            details,
            badge,
            updatedAt: new Date().toISOString()
        });

        this.usersMap.update(map => ({
            ...map,
            [userId]: {
                ...user,
                statusUpdates: updates
            }
        }));
        this.persist();
        return { ok: true };
    }

    removeStatusUpdate(userId: string, statusId: string) {
        const user = this.getUserById(userId);
        if (!user) return;

        this.usersMap.update(map => ({
            ...map,
            [userId]: {
                ...user,
                statusUpdates: user.statusUpdates.filter(item => item.id !== statusId)
            }
        }));
        this.persist();
    }

    sendNotice(userId: string, message: string) {
        const user = this.getUserById(userId);
        if (!user) {
            return;
        }

        this.usersMap.update(map => ({
            ...map,
            [userId]: {
                ...user,
                notice: message
            }
        }));

        this.adminService.sendNoticeMarquee(message, userId);
        this.persist();
    }

    clearNotice(userId: string) {
        const user = this.getUserById(userId);
        if (!user) {
            return;
        }

        this.usersMap.update(map => ({
            ...map,
            [userId]: {
                ...user,
                notice: null
            }
        }));

        this.adminService.dismissNoticeMarquee(userId);
        this.persist();
    }

    disableUser(userId: string) {
        const user = this.getUserById(userId);
        if (!user) {
            return;
        }

        this.usersMap.update(map => ({
            ...map,
            [userId]: {
                ...user,
                isDisabled: true
            }
        }));

        this.adminService.disableUser(userId);
        this.persist();
    }

    deleteUser(userId: string) {
        const nextUsers = { ...this.usersMap() };
        delete nextUsers[userId];
        this.usersMap.set(nextUsers);
        this.applications.update(apps => apps.filter(app => app.userId !== userId));

        this.chatService.clearConversation(userId);
        this.adminService.deleteUser(userId);
        this.persist();
    }

    private defaultUsers(): Record<string, AgentUserProfile> {
        const now = Date.now();

        return {
            'USR-MOCK-123': {
                id: 'USR-MOCK-123',
                fullName: 'Samantha Jane',
                email: 'samantha.jane@example.com',
                mobile: '+1 555-019-2026',
                taxId: 'ABCDE1234F',
                nationalId: '123-456-789',
                dob: '1992-08-12',
                address: '123 Tech Park Blvd, Apt 4B, Innovation District, CA 94107',
                occupation: 'I do a job in a private bank as an operations executive.',
                maritalStatus: 'married',
                spouseOccupation: 'She is a teacher.',
                employmentType: 'salaried',
                lastLoginAt: new Date(now - 1000 * 60 * 18).toISOString(),
                isDisabled: false,
                notice: null,
                statusUpdates: [
                    {
                        id: 'STS-1',
                        heading: 'BGV Under Review',
                        details: 'Manual verification is in progress. Expected turnaround is 2-4 hours.',
                        badge: 'Pending',
                        updatedAt: new Date(now - 1000 * 60 * 10).toISOString()
                    }
                ],
                payment: {
                    salaryInr: 85000,
                    bankName: 'HDFC Bank',
                    accountMasked: 'XXXXXX2458',
                    ifsc: 'HDFC0001234',
                    paymentRoutingId: 'FASTEMI-UPI-5678',
                    advanceEmiInr: 14999,
                    lastPaymentRef: 'UTR547819238',
                    lastPaymentAt: new Date(now - 1000 * 60 * 40).toISOString()
                },
                uploadedMedia: [
                    {
                        id: 'MED-1',
                        type: 'video',
                        name: 'liveness-check.mp4',
                        url: 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4',
                        uploadedBy: 'user',
                        uploadedAt: new Date(now - 1000 * 60 * 50).toISOString()
                    },
                    {
                        id: 'MED-2',
                        type: 'image',
                        name: 'salary-slip.jpg',
                        url: 'https://picsum.photos/seed/salary-slip/420/280',
                        uploadedBy: 'user',
                        uploadedAt: new Date(now - 1000 * 60 * 45).toISOString()
                    },
                    {
                        id: 'MED-3',
                        type: 'attachment',
                        name: 'bank_statement_april.pdf',
                        uploadedBy: 'user',
                        uploadedAt: new Date(now - 1000 * 60 * 43).toISOString()
                    }
                ]
            },
            'USR-MOCK-456': {
                id: 'USR-MOCK-456',
                fullName: 'David Smith',
                email: 'david.smith@example.com',
                mobile: '+1 555-882-1002',
                taxId: 'PQRSX9876Z',
                nationalId: '798-334-112',
                dob: '1990-01-17',
                address: '88 Lakeview Avenue, Austin, TX 73301',
                occupation: 'I am self-employed and run a hotel supplies business.',
                maritalStatus: 'married',
                spouseOccupation: 'She is a housewife.',
                employmentType: 'self-employed',
                lastLoginAt: new Date(now - 1000 * 60 * 77).toISOString(),
                isDisabled: false,
                notice: null,
                statusUpdates: [
                    {
                        id: 'STS-2',
                        heading: 'KYC Payment Received',
                        details: 'Your processing fee has been received successfully.',
                        badge: 'Completed',
                        updatedAt: new Date(now - 1000 * 60 * 55).toISOString()
                    }
                ],
                payment: {
                    salaryInr: 120000,
                    bankName: 'ICICI Bank',
                    accountMasked: 'XXXXXX8771',
                    ifsc: 'ICIC0000028',
                    paymentRoutingId: 'FASTEMI-UPI-8821',
                    advanceEmiInr: 24999
                },
                uploadedMedia: [
                    {
                        id: 'MED-4',
                        type: 'image',
                        name: 'business-license.png',
                        url: 'https://picsum.photos/seed/business-license/420/280',
                        uploadedBy: 'user',
                        uploadedAt: new Date(now - 1000 * 60 * 92).toISOString()
                    }
                ]
            },
            'USR-MOCK-789': {
                id: 'USR-MOCK-789',
                fullName: 'Maria Garcia',
                email: 'maria.garcia@example.com',
                mobile: '+1 555-442-9981',
                taxId: 'LMNOP5432K',
                nationalId: '492-662-100',
                dob: '1994-03-04',
                address: '77 Mission Street, San Francisco, CA 94105',
                occupation: 'I am a teacher in a public school.',
                maritalStatus: 'unmarried',
                employmentType: 'salaried',
                lastLoginAt: new Date(now - 1000 * 60 * 8).toISOString(),
                isDisabled: false,
                notice: null,
                statusUpdates: [
                    {
                        id: 'STS-3',
                        heading: 'Application Completed',
                        details: 'EMI plan onboarding has been completed and approved.',
                        badge: 'Completed',
                        updatedAt: new Date(now - 1000 * 60 * 6).toISOString()
                    }
                ],
                payment: {
                    salaryInr: 68000,
                    bankName: 'SBI Bank',
                    accountMasked: 'XXXXXX4489',
                    ifsc: 'SBIN0000456',
                    paymentRoutingId: 'FASTEMI-UPI-9912',
                    advanceEmiInr: 7999,
                    lastPaymentRef: 'UTR002761922',
                    lastPaymentAt: new Date(now - 1000 * 60 * 15).toISOString()
                },
                uploadedMedia: [
                    {
                        id: 'MED-5',
                        type: 'video',
                        name: 'face-match.mp4',
                        url: 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4',
                        uploadedBy: 'user',
                        uploadedAt: new Date(now - 1000 * 60 * 21).toISOString()
                    },
                    {
                        id: 'MED-6',
                        type: 'attachment',
                        name: 'offer_letter.pdf',
                        uploadedBy: 'user',
                        uploadedAt: new Date(now - 1000 * 60 * 20).toISOString()
                    }
                ]
            },
            'USR-MOCK-101': {
                id: 'USR-MOCK-101',
                fullName: 'Robert Chen',
                email: 'robert.chen@example.com',
                mobile: '+1 555-112-4433',
                taxId: 'YTREW4321Q',
                nationalId: '100-233-984',
                dob: '1988-11-27',
                address: '22 Sterling Heights, Newark, NJ 07102',
                occupation: 'I work as a night shift operations manager in a hotel.',
                maritalStatus: 'married',
                spouseOccupation: 'She is a homemaker.',
                employmentType: 'salaried',
                lastLoginAt: new Date(now - 1000 * 60 * 240).toISOString(),
                isDisabled: false,
                notice: null,
                statusUpdates: [
                    {
                        id: 'STS-4',
                        heading: 'BGV Rejected',
                        details: 'Mismatch found in submitted employment details.',
                        badge: 'Rejected',
                        updatedAt: new Date(now - 1000 * 60 * 230).toISOString()
                    }
                ],
                payment: {
                    salaryInr: 72000,
                    bankName: 'Axis Bank',
                    accountMasked: 'XXXXXX5510',
                    ifsc: 'UTIB0000712',
                    paymentRoutingId: 'FASTEMI-UPI-3131',
                    advanceEmiInr: 15499
                },
                uploadedMedia: [
                    {
                        id: 'MED-7',
                        type: 'image',
                        name: 'id-card.jpg',
                        url: 'https://picsum.photos/seed/idcard/420/280',
                        uploadedBy: 'user',
                        uploadedAt: new Date(now - 1000 * 60 * 230).toISOString()
                    }
                ]
            }
        };
    }

    private defaultApplications(): AgentApplicationSummary[] {
        const now = Date.now();

        return [
            {
                applicationId: 'APP-8842-X',
                userId: 'USR-MOCK-123',
                requestedAmount: 500000,
                receivedAt: new Date(now - 1000 * 60 * 2).toISOString(),
                status: ApplicationStatus.BGV_IN_PROGRESS
            },
            {
                applicationId: 'APP-7192-M',
                userId: 'USR-MOCK-456',
                requestedAmount: 1200000,
                receivedAt: new Date(now - 1000 * 60 * 45).toISOString(),
                status: ApplicationStatus.KYC_PAID
            },
            {
                applicationId: 'APP-6001-A',
                userId: 'USR-MOCK-789',
                requestedAmount: 250000,
                receivedAt: new Date(now - 1000 * 60 * 120).toISOString(),
                status: ApplicationStatus.COMPLETED
            },
            {
                applicationId: 'APP-5519-R',
                userId: 'USR-MOCK-101',
                requestedAmount: 850000,
                receivedAt: new Date(now - 1000 * 60 * 300).toISOString(),
                status: ApplicationStatus.REJECTED,
                rejectReason: 'Mismatch found in employment verification response during BGV.'
            }
        ];
    }
}
