import { Injectable, signal } from '@angular/core';
import { User } from '../models/user.model';
import { StorageService } from './storage.service';
import { BehaviorSubject, Observable } from 'rxjs';

export type AuthRole = 'user' | 'vendor';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    // Signal for modern change detection
    public currentUserSignal = signal<User | null>(null);

    constructor(private storageService: StorageService) {
        this.hydrateFromStorage();
    }

    private hydrateFromStorage() {
        const user = this.storageService.getItem<User>('current_user');
        const token = this.storageService.getCookie('jwt_token');
        if (user && token) {
            this.setUser(user);
        }
    }

    setUser(user: User) {
        this.currentUserSubject.next(user);
        this.currentUserSignal.set(user);
        this.storageService.setItem('current_user', user);
        if (user.token) {
            this.storageService.setCookie('jwt_token', user.token);
        }
    }

    logout() {
        this.storageService.removeItem('current_user');
        this.storageService.eraseCookie('jwt_token');
        this.currentUserSubject.next(null);
        this.currentUserSignal.set(null);
    }

    loginWithCredentials(role: AuthRole, email: string, password: string): { success: boolean; message?: string } {
        const cleanEmail = (email || '').trim().toLowerCase();
        const cleanPassword = (password || '').trim();

        if (!cleanEmail) {
            return { success: false, message: 'Email is required.' };
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            return { success: false, message: 'Please enter a valid email id.' };
        }
        if (!cleanPassword) {
            return { success: false, message: 'Password is required.' };
        }
        if (cleanPassword.length < 4) {
            return { success: false, message: 'Password must be at least 4 characters.' };
        }

        const fullName = this.deriveNameFromEmail(cleanEmail, role === 'user' ? 'User Account' : 'Agent Account');
        this.mockLogin(role, { email: cleanEmail, fullName });
        return { success: true };
    }

    // Tester / Bypassing Method
    mockLogin(role: AuthRole, overrides?: { email?: string; fullName?: string }) {
        const fakeToken = btoa(JSON.stringify({ role, exp: Date.now() + 86400000 }));
        const mockId = role === 'user' ? 'USR-MOCK-123' : 'VND-MOCK-999';

        // Agent persisted flags
        const isDisabled = !!localStorage.getItem(`disabled_${mockId}`);
        const marquee = localStorage.getItem(`global_marquee_notice_${mockId}`) || localStorage.getItem('global_marquee_notice');
        const assignedAgentName = localStorage.getItem(`assigned_agent_name_${mockId}`) || undefined;

        const mockProfile: User & { role?: string } = {
            id: mockId,
            fullName: overrides?.fullName || (role === 'user' ? 'Samantha Jane' : 'Acme Corporation Agent'),
            email: overrides?.email || (role === 'user' ? 'samantha.jane@example.com' : 'agent@acme.com'),
            mobile: '+15550192026',
            taxId: 'MOCKTAX889',
            nationalId: '123-456-789',
            token: fakeToken,
            role: role,
            isDisabled: isDisabled,
            activeMarqueeNotice: marquee || undefined,
            assignedAgentName: assignedAgentName,
            lastLoginAt: new Date().toISOString()
        };

        this.setUser(mockProfile);
    }

    isAuthenticated(): boolean {
        return !!this.storageService.getCookie('jwt_token');
    }

    getToken(): string | null {
        return this.storageService.getCookie('jwt_token');
    }

    private deriveNameFromEmail(email: string, fallback: string): string {
        const localPart = email.split('@')[0] || '';
        const cleaned = localPart.replace(/[._-]+/g, ' ').trim();
        if (!cleaned) return fallback;

        const titleized = cleaned
            .split(' ')
            .filter(Boolean)
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');

        return titleized || fallback;
    }
}
