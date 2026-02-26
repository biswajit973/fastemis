import { Injectable, WritableSignal, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { AuthService } from './auth.service';

export interface ChatMessage {
    id: string;
    sender: 'user' | 'agent' | 'system';
    senderName?: string;
    content: string;
    timestamp: string;
    read: boolean;
    type: 'text' | 'media';
    mediaUrl?: string;
    mediaName?: string;
    canDelete?: boolean;
    hiddenFromAgent?: boolean;
}

export interface ChatThreadSummary {
    userId: string;
    fullName: string;
    email: string;
    mobile: string;
    lastLoginAt?: string | null;
    lastSeenAt?: string | null;
    isActiveNow: boolean;
    isFavorite: boolean;
    assignedAgentName: string;
    unreadForAgent: number;
    unreadForUser: number;
    lastMessagePreview: string;
    lastMessageAt?: string | null;
}

interface ChatThreadsResponse {
    threads?: Array<{
        user_id: string | number;
        full_name?: string;
        email?: string;
        mobile_number?: string;
        last_login?: string | null;
        last_seen_at?: string | null;
        is_active_now?: boolean;
        is_favorite?: boolean;
        assigned_agent_name?: string;
        unread_for_agent?: number;
        last_message?: {
            preview?: string;
            created_at?: string | null;
        };
    }>;
    thread?: {
        user_id: string | number;
        assigned_agent_name?: string;
        unread_for_user?: number;
        last_message?: {
            preview?: string;
            created_at?: string | null;
        };
    };
}

interface ChatMessagesResponse {
    user_id: string | number;
    messages: Array<{
        id: string | number;
        sender: 'user' | 'agent' | 'system';
        senderName?: string;
        content?: string;
        timestamp: string;
        type: 'text' | 'media';
        mediaUrl?: string;
        mediaName?: string;
        read?: boolean;
        canDelete?: boolean;
    }>;
}

interface ChatMessageCreateResponse {
    message?: {
        id: string | number;
        sender: 'user' | 'agent' | 'system';
        senderName?: string;
        content?: string;
        timestamp: string;
        type: 'text' | 'media';
        mediaUrl?: string;
        mediaName?: string;
        read?: boolean;
        canDelete?: boolean;
    };
}

@Injectable({
    providedIn: 'root'
})
export class ChatService {
    private readonly messagesByUser = signal<Record<string, ChatMessage[]>>({});
    private readonly threadList = signal<ChatThreadSummary[]>([]);
    private readonly aliasByUser = signal<Record<string, string>>({});
    private readonly lastMessageIdByUser = new Map<string, number>();
    private readonly unreadCounts = new Map<string, WritableSignal<number>>();

    private presenceInterval: number | null = null;

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) { }

    getMessages(userId: string): ChatMessage[] {
        return this.messagesByUser()[userId] || [];
    }

    getSharedMedia(userId: string): ChatMessage[] {
        return this.getMessages(userId).filter(message => message.type === 'media');
    }

    getAgentAlias(userId: string): string {
        const alias = this.aliasByUser()[userId];
        if (alias && alias.trim()) {
            return alias.trim();
        }
        return 'Support Executive';
    }

    getUnreadSignal(userId: string): WritableSignal<number> {
        if (!this.unreadCounts.has(userId)) {
            this.unreadCounts.set(userId, signal<number>(0));
        }
        return this.unreadCounts.get(userId)!;
    }

    markAllAsRead(userId: string): Observable<boolean> {
        return this.fetchMessages(userId, { forceFull: true }).pipe(
            map(() => true),
            catchError(() => of(false))
        );
    }

    clearConversation(userId: string): void {
        this.messagesByUser.update(current => {
            const next = { ...current };
            delete next[userId];
            return next;
        });
        this.lastMessageIdByUser.delete(userId);
        this.getUnreadSignal(userId).set(0);
    }

    loadAgentThreads(search: string = ''): Observable<ChatThreadSummary[]> {
        let params = new HttpParams();
        const cleanSearch = String(search || '').trim();
        if (cleanSearch) {
            params = params.set('search', cleanSearch);
        }

        return this.http.get<ChatThreadsResponse>('/api/chat/threads', { params }).pipe(
            map((response) => (response?.threads || []).map((thread) => this.mapAgentThread(thread))),
            tap((threads) => {
                this.threadList.set(threads);
                const aliasMap = { ...this.aliasByUser() };
                threads.forEach((thread) => {
                    aliasMap[thread.userId] = thread.assignedAgentName;
                });
                this.aliasByUser.set(aliasMap);
            }),
            catchError(() => of(this.threadList()))
        );
    }

    toggleFavoriteThread(userId: string, favorite: boolean): Observable<boolean> {
        if (!userId) {
            return of(false);
        }
        return this.http.patch<{ is_favorite?: boolean }>(`/api/chat/threads/${userId}`, { favorite }).pipe(
            map((response) => !!response && !!response.is_favorite === favorite),
            tap(() => {
                this.threadList.update((threads) => {
                    const next = threads.map((thread) => thread.userId === userId
                        ? { ...thread, isFavorite: favorite }
                        : thread);
                    return next.sort((a, b) => {
                        if (a.isFavorite !== b.isFavorite) {
                            return a.isFavorite ? -1 : 1;
                        }
                        const aTs = new Date(a.lastMessageAt || a.lastLoginAt || 0).getTime();
                        const bTs = new Date(b.lastMessageAt || b.lastLoginAt || 0).getTime();
                        return bTs - aTs;
                    });
                });
            }),
            catchError(() => of(false))
        );
    }

    deleteChatThread(userId: string): Observable<boolean> {
        if (!userId) {
            return of(false);
        }
        return this.http.delete(`/api/chat/threads/${userId}`).pipe(
            map(() => true),
            tap(() => {
                this.threadList.update((threads) => threads.filter((thread) => thread.userId !== userId));
                this.clearConversation(userId);
            }),
            catchError(() => of(false))
        );
    }

    getThreadByUserId(userId: string): ChatThreadSummary | null {
        return this.threadList().find(thread => thread.userId === userId) || null;
    }

    loadUserThread(): Observable<ChatThreadSummary | null> {
        return this.http.get<ChatThreadsResponse>('/api/chat/threads').pipe(
            map((response) => {
                const thread = response?.thread;
                if (!thread) {
                    return null;
                }

                const userId = String(thread.user_id);
                const mapped: ChatThreadSummary = {
                    userId,
                    fullName: 'Support Chat',
                    email: '',
                    mobile: '',
                    lastLoginAt: null,
                    lastSeenAt: null,
                    isActiveNow: true,
                    isFavorite: false,
                    assignedAgentName: 'Support Executive',
                    unreadForAgent: 0,
                    unreadForUser: Number(thread.unread_for_user || 0),
                    lastMessagePreview: String(thread.last_message?.preview || 'No messages yet'),
                    lastMessageAt: thread.last_message?.created_at || null
                };

                this.aliasByUser.update(current => ({
                    ...current,
                    [userId]: String(thread.assigned_agent_name || 'Support Executive')
                }));

                this.getUnreadSignal(userId).set(mapped.unreadForUser);
                return mapped;
            }),
            catchError(() => of(null))
        );
    }

    fetchMessages(userId: string, options?: { forceFull?: boolean; limit?: number }): Observable<ChatMessage[]> {
        const isAgent = this.authService.currentUserSignal()?.role === 'vendor';
        const forceFull = !!options?.forceFull;
        const limit = options?.limit ?? 120;

        let params = new HttpParams().set('limit', String(limit));
        if (isAgent) {
            params = params.set('user_id', userId);
        }

        const existingLastId = this.lastMessageIdByUser.get(userId);
        if (!forceFull && existingLastId && existingLastId > 0) {
            params = params.set('since_id', String(existingLastId));
        }

        return this.http.get<ChatMessagesResponse>('/api/chat/messages', { params }).pipe(
            map((response) => (response?.messages || [])
                .map(raw => this.normalizeMessage(raw))
                .filter((message): message is ChatMessage => !!message)),
            tap((incomingMessages) => {
                const incremental = !forceFull && !!existingLastId;
                this.mergeMessages(userId, incomingMessages, incremental);
            }),
            map(() => this.getMessages(userId)),
            catchError(() => of(this.getMessages(userId)))
        );
    }

    sendTextMessage(userId: string, text: string): Observable<ChatMessage | null> {
        const trimmed = String(text || '').trim();
        if (!trimmed) {
            return of(null);
        }

        const isAgent = this.authService.currentUserSignal()?.role === 'vendor';
        const payload: Record<string, string> = {
            content: trimmed
        };
        if (isAgent) {
            payload['user_id'] = userId;
        }

        return this.http.post<ChatMessageCreateResponse>('/api/chat/messages', payload).pipe(
            map((response) => this.normalizeMessage(response?.message || null)),
            tap((message) => {
                if (message) {
                    this.mergeMessages(userId, [message], true);
                }
            }),
            catchError(() => of(null))
        );
    }

    sendMediaMessage(userId: string, file: File, caption: string = ''): Observable<ChatMessage | null> {
        if (!file) {
            return of(null);
        }

        const isAgent = this.authService.currentUserSignal()?.role === 'vendor';
        const formData = new FormData();
        formData.append('media_file', file);
        formData.append('content', String(caption || '').trim());
        if (isAgent) {
            formData.append('user_id', userId);
        }

        return this.http.post<ChatMessageCreateResponse>('/api/chat/messages', formData).pipe(
            map((response) => this.normalizeMessage(response?.message || null)),
            tap((message) => {
                if (message) {
                    this.mergeMessages(userId, [message], true);
                }
            }),
            catchError(() => of(null))
        );
    }

    deleteMessageForEveryone(userId: string, messageId: string): Observable<boolean> {
        const id = Number(messageId);
        if (!Number.isFinite(id) || id <= 0) {
            return of(false);
        }

        return this.http.delete(`/api/chat/messages/${id}`).pipe(
            map(() => true),
            tap(() => {
                this.messagesByUser.update(current => ({
                    ...current,
                    [userId]: (current[userId] || []).filter(message => message.id !== messageId)
                }));
                this.recomputeUnread(userId);
            }),
            catchError(() => of(false))
        );
    }

    setAgentAlias(userId: string, alias: string): Observable<boolean> {
        const cleanAlias = String(alias || '').trim();
        if (!cleanAlias) {
            return of(false);
        }

        return this.http.post<{ assigned_agent_name?: string }>('/api/chat/alias', {
            user_id: userId,
            alias: cleanAlias
        }).pipe(
            map((response) => String(response?.assigned_agent_name || cleanAlias)),
            tap((resolvedAlias) => {
                this.aliasByUser.update(current => ({
                    ...current,
                    [userId]: resolvedAlias
                }));
            }),
            map(() => true),
            catchError(() => of(false))
        );
    }

    startPresenceHeartbeat(intervalMs: number = 30000): void {
        const user = this.authService.currentUserSignal();
        if (!user || user.role !== 'user') {
            return;
        }

        this.stopPresenceHeartbeat();
        this.pingPresence().subscribe();
        this.presenceInterval = window.setInterval(() => {
            this.pingPresence().subscribe();
        }, intervalMs);
    }

    stopPresenceHeartbeat(): void {
        if (this.presenceInterval !== null) {
            window.clearInterval(this.presenceInterval);
            this.presenceInterval = null;
        }
    }

    private pingPresence(): Observable<boolean> {
        return this.http.post('/api/chat/presence', {}).pipe(
            map(() => true),
            catchError(() => of(false))
        );
    }

    private mapAgentThread(raw: {
        user_id: string | number;
        full_name?: string;
        email?: string;
        mobile_number?: string;
        last_login?: string | null;
        last_seen_at?: string | null;
        is_active_now?: boolean;
        assigned_agent_name?: string;
        is_favorite?: boolean;
        unread_for_agent?: number;
        last_message?: {
            preview?: string;
            created_at?: string | null;
        };
    }): ChatThreadSummary {
        return {
            userId: String(raw.user_id),
            fullName: String(raw.full_name || 'Not filled yet'),
            email: String(raw.email || ''),
            mobile: String(raw.mobile_number || ''),
            lastLoginAt: raw.last_login || null,
            lastSeenAt: raw.last_seen_at || null,
            isActiveNow: !!raw.is_active_now,
            isFavorite: !!raw.is_favorite,
            assignedAgentName: String(raw.assigned_agent_name || 'Support Executive'),
            unreadForAgent: Number(raw.unread_for_agent || 0),
            unreadForUser: 0,
            lastMessagePreview: String(raw.last_message?.preview || 'No messages yet'),
            lastMessageAt: raw.last_message?.created_at || null
        };
    }

    private normalizeMessage(raw: {
        id: string | number;
        sender: 'user' | 'agent' | 'system';
        senderName?: string;
        content?: string;
        timestamp: string;
        type: 'text' | 'media';
        mediaUrl?: string;
        mediaName?: string;
        read?: boolean;
        canDelete?: boolean;
    } | null): ChatMessage | null {
        if (!raw) {
            return null;
        }

        return {
            id: String(raw.id),
            sender: raw.sender,
            senderName: String(raw.senderName || ''),
            content: String(raw.content || ''),
            timestamp: raw.timestamp,
            read: !!raw.read,
            type: raw.type,
            mediaUrl: raw.mediaUrl ? String(raw.mediaUrl) : '',
            mediaName: raw.mediaName ? String(raw.mediaName) : '',
            canDelete: !!raw.canDelete
        };
    }

    private mergeMessages(userId: string, incomingMessages: ChatMessage[], incremental: boolean): void {
        const cleanIncoming = incomingMessages.filter((message): message is ChatMessage => !!message && !!message.id);
        if (!cleanIncoming.length && incremental) {
            return;
        }

        const currentMessages = this.getMessages(userId);
        const byId = new Map<string, ChatMessage>();

        if (incremental) {
            currentMessages.forEach(message => byId.set(message.id, message));
        }

        cleanIncoming.forEach(message => byId.set(message.id, message));

        const merged = Array.from(byId.values())
            .sort((a, b) => {
                const aId = Number(a.id);
                const bId = Number(b.id);
                if (Number.isFinite(aId) && Number.isFinite(bId)) {
                    return aId - bId;
                }
                return a.timestamp.localeCompare(b.timestamp);
            })
            .slice(-500);

        this.messagesByUser.update(current => ({
            ...current,
            [userId]: merged
        }));

        const maxId = merged.reduce((max, message) => {
            const id = Number(message.id);
            return Number.isFinite(id) && id > max ? id : max;
        }, 0);
        if (maxId > 0) {
            this.lastMessageIdByUser.set(userId, maxId);
        }

        this.recomputeUnread(userId);
    }

    private recomputeUnread(userId: string): void {
        const isUser = this.authService.currentUserSignal()?.role === 'user';
        const unread = this.getMessages(userId).filter(message => {
            if (isUser) {
                return message.sender !== 'user' && !message.read;
            }
            return message.sender === 'user' && !message.read;
        }).length;
        this.getUnreadSignal(userId).set(unread);
    }
}
