import { Injectable, signal } from '@angular/core';
import { User } from '../models/user.model';
import { StorageService } from './storage.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of, tap } from 'rxjs';

export type AuthRole = 'user' | 'vendor';

export interface SignupPayload {
    firstName: string;
    lastName?: string;
    email: string;
    mobileNumber?: string;
    maritalStatus?: 'married' | 'unmarried';
    occupationDetails?: string;
    monthlySalaryInr?: string | number;
    password: string;
}

export interface ProfileCompletionState {
    complete: boolean;
    progress: number;
    missingFields: string[];
}

interface BackendAuthUser {
    id: string | number;
    email: string;
    first_name?: string;
    mobile_number?: string;
    role?: string;
    agreement_tab_enabled?: boolean;
    agreement_completed_at?: string | null;
    profile_complete?: boolean;
    profile_progress?: number;
    missing_fields?: string[];
}

interface BackendAuthResponse {
    access: string;
    refresh: string;
    user: BackendAuthUser;
}

export interface BackendUserProfileResponse {
    id: string | number;
    email: string;
    first_name?: string;
    last_name?: string;
    mobile_number?: string;
    marital_status?: string;
    spouse_occupation?: string;
    pincode?: string;
    city?: string;
    full_address?: string;
    employment_type?: string;
    what_you_do?: string;
    monthly_salary?: string;
    requested_amount?: string;
    aadhar_number?: string;
    pan_number?: string;
    aadhar_image?: string;
    pancard_image?: string;
    live_photo?: string;
    agreement_tab_enabled?: boolean;
    agreement_complete?: boolean;
    agreement_completed_at?: string | null;
    agreement_signature?: string;
    agreement_consent_video?: string;
    profile_complete?: boolean;
    profile_progress?: number;
    missing_fields?: string[];
    [key: string]: unknown;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    public currentUserSignal = signal<User | null>(null);

    constructor(
        private storageService: StorageService,
        private http: HttpClient
    ) {
        this.hydrateFromStorage();
    }

    private hydrateFromStorage() {
        const user = this.storageService.getItem<User>('current_user');
        const token = this.storageService.getCookie('jwt_token');
        if (user && token) {
            this.setUser({ ...user, token }, { persist: true });
        }
    }

    setUser(user: User, options?: { persist?: boolean }) {
        const persist = options?.persist ?? !!this.storageService.getCookie('jwt_token');
        this.currentUserSubject.next(user);
        this.currentUserSignal.set(user);

        this.storageService.setSessionToken(user.token || null);
        if (persist) {
            this.storageService.setItem('current_user', user);
            if (user.token) {
                this.storageService.setCookie('jwt_token', user.token);
            }
        } else {
            this.storageService.removeItem('current_user');
            this.storageService.eraseCookie('jwt_token');
        }
    }

    logout() {
        this.storageService.removeItem('current_user');
        this.storageService.eraseCookie('jwt_token');
        this.storageService.setSessionToken(null);
        this.currentUserSubject.next(null);
        this.currentUserSignal.set(null);
    }

    loginUserViaBackend(email: string, password: string, rememberMe: boolean = true): Observable<{ success: boolean; message?: string }> {
        const cleanEmail = (email || '').trim().toLowerCase();
        const cleanPassword = (password || '').trim();

        if (!cleanEmail) {
            return of({ success: false, message: 'Email is required.' });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            return of({ success: false, message: 'Please enter a valid email id.' });
        }
        if (!cleanPassword) {
            return of({ success: false, message: 'Password is required.' });
        }
        if (cleanPassword.length < 4) {
            return of({ success: false, message: 'Password must be at least 4 characters.' });
        }

        return this.http.post<BackendAuthResponse>('/api/login', {
            email: cleanEmail,
            password: cleanPassword
        }).pipe(
            tap(res => this.setUser(this.mapBackendUserToAuthUser(res.user, res.access, 'user'), { persist: rememberMe })),
            map(() => ({ success: true })),
            catchError((err) => {
                const backendMessage = err?.error?.error || err?.error?.detail;
                return of({
                    success: false,
                    message: backendMessage || 'Sign in failed. Please verify your email and password.'
                });
            })
        );
    }

    signupUserViaBackend(payload: SignupPayload): Observable<{ success: boolean; message?: string }> {
        const firstName = (payload.firstName || '').trim();
        const email = (payload.email || '').trim().toLowerCase();
        const password = (payload.password || '').trim();

        if (!firstName) {
            return of({ success: false, message: 'First name is required.' });
        }
        if (!email) {
            return of({ success: false, message: 'Email is required.' });
        }
        if (!password || password.length < 4) {
            return of({ success: false, message: 'Password must be at least 4 characters.' });
        }

        return this.http.post<BackendAuthResponse>('/api/signup', {
            first_name: firstName,
            last_name: (payload.lastName || '').trim(),
            email,
            mobile_number: (payload.mobileNumber || '').trim(),
            marital_status: payload.maritalStatus || '',
            what_you_do: (payload.occupationDetails || '').trim(),
            monthly_salary: payload.monthlySalaryInr ? String(payload.monthlySalaryInr).trim() : '',
            password
        }).pipe(
            tap(res => this.setUser(this.mapBackendUserToAuthUser(res.user, res.access, 'user'), { persist: true })),
            map(() => ({ success: true })),
            catchError((err) => {
                const backendMessage = err?.error?.error
                    || err?.error?.detail
                    || err?.error?.email?.[0];
                return of({
                    success: false,
                    message: backendMessage || 'Account creation failed. Please verify your details.'
                });
            })
        );
    }

    loginAgentViaBackend(passcode: string): Observable<{ success: boolean; message?: string }> {
        const cleanPasscode = (passcode || '').trim();

        if (!cleanPasscode) {
            return of({ success: false, message: 'Passcode is required.' });
        }

        return this.http.post<BackendAuthResponse>('/api/agent/access', {
            passcode: cleanPasscode
        }).pipe(
            tap(res => this.setUser(this.mapBackendUserToAuthUser(res.user, res.access, 'vendor'), { persist: true })),
            map(() => ({ success: true })),
            catchError((err) => {
                const backendMessage = err?.error?.error || err?.error?.detail;
                return of({
                    success: false,
                    message: backendMessage || 'Agent login failed. Please verify passcode.'
                });
            })
        );
    }

    getBackendUserProfile(): Observable<BackendUserProfileResponse> {
        return this.http.get<BackendUserProfileResponse>('/api/userprofile/').pipe(
            tap((profile) => {
                this.applyProfileState(profile);
            })
        );
    }

    updateBackendUserProfile(payload: FormData): Observable<BackendUserProfileResponse> {
        return this.http.patch<BackendUserProfileResponse>('/api/userprofile/', payload).pipe(
            tap((profile) => {
                this.applyProfileState(profile);
            })
        );
    }

    resolveProfileCompletionState(forceRefresh: boolean = false): Observable<ProfileCompletionState> {
        const currentUser = this.currentUserSignal();
        if (!currentUser) {
            return of({ complete: false, progress: 0, missingFields: [] });
        }

        if (!forceRefresh && typeof currentUser.profileComplete === 'boolean') {
            return of({
                complete: currentUser.profileComplete,
                progress: currentUser.profileProgress ?? 0,
                missingFields: currentUser.missingFields ?? []
            });
        }

        return this.getBackendUserProfile().pipe(
            map(profile => this.extractCompletionState(profile)),
            catchError(() => of({
                complete: currentUser.profileComplete ?? false,
                progress: currentUser.profileProgress ?? 0,
                missingFields: currentUser.missingFields ?? []
            }))
        );
    }

    isAuthenticated(): boolean {
        return !!(this.storageService.getCookie('jwt_token') || this.storageService.getSessionToken());
    }

    getToken(): string | null {
        return this.storageService.getCookie('jwt_token') || this.storageService.getSessionToken();
    }

    private applyProfileState(payload: {
        profile_complete?: boolean;
        profile_progress?: number;
        missing_fields?: string[];
        agreement_tab_enabled?: boolean;
        agreement_completed_at?: string | null;
    }) {
        const state = this.extractCompletionState(payload);
        const current = this.currentUserSignal();
        if (!current) {
            return;
        }

        this.setUser({
            ...current,
            profileComplete: state.complete,
            profileProgress: state.progress,
            missingFields: state.missingFields,
            agreementTabEnabled: !!payload.agreement_tab_enabled,
            agreementCompletedAt: payload.agreement_completed_at || null
        });
    }

    private extractCompletionState(payload: {
        profile_complete?: boolean;
        profile_progress?: number;
        missing_fields?: string[];
    } | undefined): ProfileCompletionState {
        return {
            complete: !!payload?.profile_complete,
            progress: Number(payload?.profile_progress ?? 0),
            missingFields: Array.isArray(payload?.missing_fields) ? payload?.missing_fields : []
        };
    }

    private mapBackendUserToAuthUser(
        backendUser: BackendAuthUser | undefined,
        accessToken: string,
        fallbackRole: AuthRole
    ): User {
        const role: AuthRole = backendUser?.role === 'vendor'
            ? 'vendor'
            : (fallbackRole === 'vendor' ? 'vendor' : 'user');

        const completion = this.extractCompletionState(backendUser);

        return {
            id: String(backendUser?.id ?? ''),
            fullName: backendUser?.first_name || 'FastEMIs User',
            email: backendUser?.email || '',
            mobile: backendUser?.mobile_number || '',
            taxId: '',
            nationalId: '',
            token: accessToken,
            role,
            agreementTabEnabled: !!backendUser?.agreement_tab_enabled,
            agreementCompletedAt: backendUser?.agreement_completed_at || null,
            profileComplete: completion.complete,
            profileProgress: completion.progress,
            missingFields: completion.missingFields,
            lastLoginAt: new Date().toISOString()
        };
    }
}
