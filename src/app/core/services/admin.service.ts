import { Injectable, signal } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class AdminService {
    // Global flag for the currently active marquee message sent by the agent
    public activeNoticeMarquee = signal<string | null>(null);

    // Track disabled users by their IDs locally for mock purposes
    public disabledUsers = signal<Set<string>>(new Set());

    constructor(private authService: AuthService) { }

    /**
     * Broadcasts a notice to the user dashboard.
     */
    sendNoticeMarquee(message: string, userId?: string) {
        const targetUserId = userId || this.authService.currentUserSignal()?.id || 'USR-MOCK-123';
        this.activeNoticeMarquee.set(message);
        localStorage.setItem(`global_marquee_notice_${targetUserId}`, message);

        // Also inject into the mock user profile directly
        const user = this.authService.currentUserSignal();
        if (user && user.id === targetUserId) {
            this.authService.setUser({ ...user, activeMarqueeNotice: message });
        }
    }

    /**
     * Dismisses the notice from the user dashboard.
     */
    dismissNoticeMarquee(userId?: string) {
        const targetUserId = userId || this.authService.currentUserSignal()?.id || 'USR-MOCK-123';
        this.activeNoticeMarquee.set(null);
        localStorage.removeItem(`global_marquee_notice_${targetUserId}`);

        const user = this.authService.currentUserSignal();
        if (user && user.id === targetUserId) {
            this.authService.setUser({ ...user, activeMarqueeNotice: null });
        }
    }

    /**
     * Disables a user by adding them to the blacklist map.
     * This flag will trigger the 90% timeout trap.
     */
    disableUser(userId: string) {
        const set = this.disabledUsers();
        set.add(userId);
        this.disabledUsers.set(new Set(set));
        localStorage.setItem(`disabled_${userId}`, '1');

        // Auto-update if looking at themselves (demo mode)
        const user = this.authService.currentUserSignal();
        if (user && user.id === userId) {
            this.authService.setUser({ ...user, isDisabled: true });
        }
    }

    /**
     * Re-enables a disabled user (tester bypass / admin recovery).
     */
    enableUser(userId: string) {
        const set = this.disabledUsers();
        set.delete(userId);
        this.disabledUsers.set(new Set(set));
        localStorage.removeItem(`disabled_${userId}`);

        const user = this.authService.currentUserSignal();
        if (user && user.id === userId) {
            this.authService.setUser({ ...user, isDisabled: false });
        }
    }

    /**
     * Permanently wipes user data (Simulated).
     */
    deleteUser(userId: string) {
        localStorage.removeItem(`disabled_${userId}`);
        localStorage.removeItem(`global_marquee_notice_${userId}`);
        localStorage.removeItem(`assigned_agent_name_${userId}`);

        // In a real app this makes an API DELETE call.
        // For demo: if we delete the current user, log them out.
        const user = this.authService.currentUserSignal();
        if (user && user.id === userId) {
            this.authService.logout();
        }
    }

    /**
     * Checks if a user is trapped/disabled.
     */
    isUserDisabled(userId: string): boolean {
        return this.disabledUsers().has(userId) || !!localStorage.getItem(`disabled_${userId}`);
    }
}
