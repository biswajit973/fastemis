import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, map, of, tap } from 'rxjs';

export type AnnouncementType = 'GLOBAL' | 'PRIVATE';

export interface Announcement {
    id: string;
    type: AnnouncementType;
    targetUserId?: string;
    targetUserName?: string;
    targetUserMobile?: string;
    title: string;
    description: string;
    ctaText: string;
    priorityLabel?: string;
    createdAt: number;
    updatedAt: number;
}

export interface AnnouncementCounts {
    globalActive: number;
    privateActiveTotal: number;
    privateActiveByUser: Record<string, number>;
}

interface AnnouncementApiItem {
    id: string | number;
    type: string;
    target_user_id?: string | number;
    target_user_name?: string;
    target_user_mobile?: string;
    title?: string;
    description?: string;
    cta_text?: string;
    priority_label?: string;
    created_at?: string;
    updated_at?: string;
}

interface AnnouncementApiResponse {
    announcements?: AnnouncementApiItem[];
}

interface AgentAnnouncementListResponse extends AnnouncementApiResponse {
    counts?: {
        global_active?: number;
        private_active_total?: number;
        private_active_by_user?: Record<string, number>;
    };
}

interface AgentAnnouncementWriteResponse {
    message?: string;
    announcement?: AnnouncementApiItem;
    counts?: {
        global_active?: number;
        private_active_total?: number;
        private_active_by_user?: Record<string, number>;
    };
}

@Injectable({
    providedIn: 'root'
})
export class AnnouncementService {
    private readonly agentAnnouncementsState = signal<Announcement[]>([]);
    private readonly userAnnouncementsState = signal<Announcement[]>([]);
    private readonly loadingState = signal<boolean>(false);
    private readonly countsState = signal<AnnouncementCounts>({
        globalActive: 0,
        privateActiveTotal: 0,
        privateActiveByUser: {}
    });

    readonly loading = this.loadingState.asReadonly();
    readonly counts = this.countsState.asReadonly();

    constructor(private http: HttpClient) { }

    getAnnouncementsForUser(_userId: string): Announcement[] {
        const userList = this.userAnnouncementsState();
        if (userList.length > 0) {
            return [...userList].sort((a, b) => b.createdAt - a.createdAt);
        }
        return [...this.agentAnnouncementsState()]
            .filter(item => item.type === 'GLOBAL')
            .sort((a, b) => b.createdAt - a.createdAt);
    }

    getAllAnnouncements(): Announcement[] {
        return [...this.agentAnnouncementsState()].sort((a, b) => b.createdAt - a.createdAt);
    }

    loadUserAnnouncements(): Observable<Announcement[]> {
        this.loadingState.set(true);
        return this.http.get<AnnouncementApiResponse>('/api/announcements').pipe(
            map((response) => (response?.announcements || []).map(raw => this.mapAnnouncement(raw))),
            tap((announcements) => this.userAnnouncementsState.set(announcements)),
            catchError(() => {
                this.userAnnouncementsState.set([]);
                return of([]);
            }),
            finalize(() => this.loadingState.set(false))
        );
    }

    loadAgentAnnouncements(searchTerm: string = ''): Observable<Announcement[]> {
        let params = new HttpParams();
        const q = String(searchTerm || '').trim();
        if (q) {
            params = params.set('search', q);
        }

        this.loadingState.set(true);
        return this.http.get<AgentAnnouncementListResponse>('/api/agent/announcements', { params }).pipe(
            tap((response) => this.applyCounts(response?.counts)),
            map((response) => (response?.announcements || []).map(raw => this.mapAnnouncement(raw))),
            tap((announcements) => this.agentAnnouncementsState.set(announcements)),
            catchError(() => {
                this.agentAnnouncementsState.set([]);
                return of([]);
            }),
            finalize(() => this.loadingState.set(false))
        );
    }

    createAnnouncement(payload: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>): Observable<{ success: boolean; message?: string; announcement?: Announcement }> {
        const body = {
            type: payload.type,
            target_user_id: payload.type === 'PRIVATE' ? String(payload.targetUserId || '').trim() : '',
            title: String(payload.title || '').trim(),
            description: String(payload.description || '').trim(),
            cta_text: String(payload.ctaText || '').trim(),
            priority_label: String(payload.priorityLabel || 'IMPORTANT').trim().toUpperCase()
        };

        return this.http.post<AgentAnnouncementWriteResponse>('/api/agent/announcements', body).pipe(
            tap((response) => this.applyCounts(response?.counts)),
            map((response) => {
                const created = response?.announcement ? this.mapAnnouncement(response.announcement) : undefined;
                if (created) {
                    this.agentAnnouncementsState.update((items) => [created, ...items.filter(item => item.id !== created.id)]);
                }
                return {
                    success: true,
                    message: response?.message || 'Announcement created successfully.',
                    announcement: created
                };
            }),
            catchError((err) => of({
                success: false,
                message: this.extractError(err, 'Failed to create announcement.')
            }))
        );
    }

    updateAnnouncement(
        id: string,
        payload: Partial<Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>>
    ): Observable<{ success: boolean; message?: string; announcement?: Announcement }> {
        const body: Record<string, unknown> = {};
        if (payload.type) body['type'] = payload.type;
        if (payload.targetUserId !== undefined) body['target_user_id'] = String(payload.targetUserId || '').trim();
        if (payload.title !== undefined) body['title'] = String(payload.title || '').trim();
        if (payload.description !== undefined) body['description'] = String(payload.description || '').trim();
        if (payload.ctaText !== undefined) body['cta_text'] = String(payload.ctaText || '').trim();
        if (payload.priorityLabel !== undefined) body['priority_label'] = String(payload.priorityLabel || '').trim().toUpperCase();

        return this.http.patch<AgentAnnouncementWriteResponse>(`/api/agent/announcements/${id}`, body).pipe(
            tap((response) => this.applyCounts(response?.counts)),
            map((response) => {
                const updated = response?.announcement ? this.mapAnnouncement(response.announcement) : undefined;
                if (updated) {
                    this.agentAnnouncementsState.update((items) =>
                        items.map(item => (item.id === updated.id ? updated : item))
                    );
                    this.userAnnouncementsState.update((items) =>
                        items.map(item => (item.id === updated.id ? updated : item))
                    );
                }
                return {
                    success: true,
                    message: response?.message || 'Announcement updated successfully.',
                    announcement: updated
                };
            }),
            catchError((err) => of({
                success: false,
                message: this.extractError(err, 'Failed to update announcement.')
            }))
        );
    }

    deleteAnnouncement(id: string): Observable<{ success: boolean; message?: string }> {
        return this.http.delete<AgentAnnouncementWriteResponse>(`/api/agent/announcements/${id}`).pipe(
            tap((response) => this.applyCounts(response?.counts)),
            tap(() => {
                this.agentAnnouncementsState.update((items) => items.filter(item => item.id !== id));
                this.userAnnouncementsState.update((items) => items.filter(item => item.id !== id));
            }),
            map((response) => ({
                success: true,
                message: response?.message || 'Announcement deleted successfully.'
            })),
            catchError((err) => of({
                success: false,
                message: this.extractError(err, 'Failed to delete announcement.')
            }))
        );
    }

    private mapAnnouncement(raw: AnnouncementApiItem): Announcement {
        const type = String(raw?.type || '').toUpperCase() === 'PRIVATE' ? 'PRIVATE' : 'GLOBAL';
        return {
            id: String(raw?.id || ''),
            type,
            targetUserId: String(raw?.target_user_id || '').trim() || undefined,
            targetUserName: String(raw?.target_user_name || '').trim() || undefined,
            targetUserMobile: String(raw?.target_user_mobile || '').trim() || undefined,
            title: String(raw?.title || '').trim(),
            description: String(raw?.description || '').trim(),
            ctaText: String(raw?.cta_text || '').trim(),
            priorityLabel: String(raw?.priority_label || '').trim() || undefined,
            createdAt: this.isoToEpoch(raw?.created_at),
            updatedAt: this.isoToEpoch(raw?.updated_at)
        };
    }

    private isoToEpoch(value: string | undefined): number {
        if (!value) return Date.now();
        const parsed = Date.parse(value);
        return Number.isFinite(parsed) ? parsed : Date.now();
    }

    private applyCounts(raw?: {
        global_active?: number;
        private_active_total?: number;
        private_active_by_user?: Record<string, number>;
    }) {
        this.countsState.set({
            globalActive: Number(raw?.global_active ?? 0),
            privateActiveTotal: Number(raw?.private_active_total ?? 0),
            privateActiveByUser: raw?.private_active_by_user || {}
        });
    }

    private extractError(err: any, fallback: string): string {
        const payload = err?.error;
        if (typeof payload === 'string' && payload.trim()) {
            return payload.trim();
        }
        if (payload?.error) {
            return String(payload.error);
        }
        const firstKey = payload && typeof payload === 'object' ? Object.keys(payload)[0] : '';
        if (firstKey) {
            const value = payload[firstKey];
            if (Array.isArray(value) && value.length > 0) {
                return String(value[0]);
            }
            if (value !== undefined && value !== null && String(value).trim()) {
                return String(value).trim();
            }
        }
        return fallback;
    }
}
