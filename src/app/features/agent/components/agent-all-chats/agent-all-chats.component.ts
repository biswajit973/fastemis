import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { GhostChatService, GhostThreadSummary } from '../../../../core/services/ghost-chat.service';

@Component({
  selector: 'app-agent-all-chats',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pb-8">
      <div class="mb-6 flex flex-col gap-3">
        <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 class="text-2xl sm:text-3xl font-display font-bold text-primary mb-1">Ghost Chat</h1>
            <p class="text-sm text-secondary">Private user-to-persona threads routed to agent only.</p>
          </div>
          <button
            type="button"
            (click)="refresh()"
            [disabled]="loading()"
            class="px-3 py-2 rounded-lg border border-border text-sm text-primary hover:bg-surface-2 disabled:opacity-60">
            {{ loading() ? 'Refreshing...' : 'Refresh' }}
          </button>
        </div>

        <div class="bg-surface border border-border rounded-xl p-3">
          <label class="block text-xs text-secondary mb-1">Search by user/persona/name/number</label>
          <div class="flex items-center gap-2">
            <input
              [(ngModel)]="searchTerm"
              (ngModelChange)="onSearchChange($event)"
              type="text"
              placeholder="Type to search..."
              class="flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            <button
              type="button"
              (click)="clearSearch()"
              [disabled]="!searchTerm.trim()"
              class="px-3 py-2 rounded-lg border border-border text-xs text-secondary hover:text-primary disabled:opacity-50">
              Clear
            </button>
          </div>
        </div>
      </div>

      <div class="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div *ngIf="loading() && threads().length === 0" class="p-8 flex items-center justify-center">
          <div class="w-8 h-8 rounded-full border-2 border-surface-3 border-t-primary animate-spin"></div>
        </div>

        <div *ngIf="!loading() && threads().length === 0" class="p-8 text-center text-secondary">No ghost chat threads found.</div>

        <div class="divide-y divide-border" *ngIf="threads().length > 0">
          <article *ngFor="let thread of threads(); trackBy: trackByThread"
            class="p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:bg-surface-2/60 transition-colors">
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h2 class="font-semibold text-primary truncate">{{ thread.user_name || 'User' }}</h2>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">{{ thread.persona.display_name }}</span>
                <span *ngIf="thread.persona.ghost_id" class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-2 text-secondary border border-border">
                  {{ thread.persona.ghost_id }}
                </span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  [ngClass]="thread.user_is_active_now ? 'bg-success/10 text-success' : 'bg-surface-2 text-secondary'">
                  {{ thread.user_is_active_now ? 'Active now' : 'Offline' }}
                </span>
                <span *ngIf="thread.unread_for_agent > 0" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-error/10 text-error">
                  {{ thread.unread_for_agent }} unread
                </span>
              </div>
              <p class="text-xs text-secondary mt-1 truncate">{{ thread.user_email || 'No email' }} • {{ thread.user_mobile || 'No mobile' }}</p>
              <p *ngIf="thread.persona.info" class="text-xs text-secondary truncate">{{ thread.persona.info }}</p>
              <p class="text-xs text-secondary truncate">Last login: {{ formatDateTime(thread.user_last_login) }}</p>
              <p class="text-xs text-muted mt-1 truncate">{{ thread.last_message?.preview || 'No messages yet' }}</p>
            </div>

            <div class="flex flex-wrap gap-2 items-center">
              <button
                type="button"
                (click)="toggleFavorite(thread)"
                [disabled]="favoriteBusyThreadId() === thread.thread_id"
                class="px-3 py-2 rounded-lg border text-xs font-medium transition-colors disabled:opacity-60"
                [ngClass]="thread.is_favorite ? 'border-warning text-warning hover:bg-warning/10' : 'border-border text-secondary hover:text-primary'">
                {{ favoriteBusyThreadId() === thread.thread_id ? 'Saving...' : (thread.is_favorite ? 'Unfavorite' : 'Favorite') }}
              </button>

              <button
                type="button"
                (click)="openDeleteConfirm(thread)"
                [disabled]="deleteBusyThreadId() === thread.thread_id"
                class="px-3 py-2 rounded-lg border border-error text-error text-xs font-medium hover:bg-error/10 transition-colors disabled:opacity-60">
                {{ deleteBusyThreadId() === thread.thread_id ? 'Deleting...' : 'Delete Chat' }}
              </button>

              <a [routerLink]="['/agent/chats', thread.thread_id]"
                class="px-4 py-2 rounded-lg border border-border bg-surface text-primary text-sm font-medium no-underline hover:border-primary transition-colors">
                Open Chat
              </a>
            </div>
          </article>
        </div>
      </div>
    </div>

    <div *ngIf="confirmDeleteThread()" class="fixed inset-0 z-[90] bg-black/45 backdrop-blur-[1px] flex items-center justify-center p-4">
      <div class="w-full max-w-md rounded-2xl border border-border bg-surface shadow-xl p-5">
        <h3 class="text-lg font-semibold text-primary mb-1">Delete entire ghost chat?</h3>
        <p class="text-sm text-secondary mb-4">
          This removes all messages for
          <span class="font-semibold text-primary">{{ confirmDeleteThread()!.user_name || 'User' }}</span>
          and persona <span class="font-semibold text-primary">{{ confirmDeleteThread()!.persona.display_name }}</span>.
        </p>
        <div class="flex items-center justify-end gap-2">
          <button type="button" (click)="confirmDeleteThread.set(null)" class="px-3 py-2 rounded-lg border border-border text-secondary hover:text-primary">Cancel</button>
          <button
            type="button"
            (click)="deleteThreadConfirmed()"
            [disabled]="deleteBusyThreadId() === confirmDeleteThread()!.thread_id"
            class="px-3 py-2 rounded-lg bg-error text-white hover:bg-error/90 disabled:opacity-60">
            {{ deleteBusyThreadId() === confirmDeleteThread()!.thread_id ? 'Deleting...' : 'Delete Chat' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class AgentAllChatsComponent implements OnInit, OnDestroy {
  threads = signal<GhostThreadSummary[]>([]);
  loading = signal<boolean>(false);
  favoriteBusyThreadId = signal<string>('');
  deleteBusyThreadId = signal<string>('');
  confirmDeleteThread = signal<GhostThreadSummary | null>(null);

  searchTerm = '';
  private poller: number | null = null;
  private searchTimer: number | null = null;

  constructor(private ghostChatService: GhostChatService) {}

  ngOnInit(): void {
    this.refresh();
    this.poller = window.setInterval(() => this.refresh(), 9000);
  }

  ngOnDestroy(): void {
    if (this.poller !== null) {
      window.clearInterval(this.poller);
      this.poller = null;
    }
    if (this.searchTimer !== null) {
      window.clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }
  }

  refresh(): void {
    this.loading.set(true);
    this.ghostChatService.loadAgentThreads(this.searchTerm).subscribe((threads) => {
      this.threads.set(threads);
      this.loading.set(false);
    });
  }

  onSearchChange(_value: string): void {
    if (this.searchTimer !== null) {
      window.clearTimeout(this.searchTimer);
    }
    this.searchTimer = window.setTimeout(() => this.refresh(), 300);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.refresh();
  }

  toggleFavorite(thread: GhostThreadSummary): void {
    this.favoriteBusyThreadId.set(thread.thread_id);
    this.ghostChatService.updateThread(thread.thread_id, {
      is_favorite: !thread.is_favorite
    }).subscribe(() => {
      this.favoriteBusyThreadId.set('');
      this.refresh();
    });
  }

  openDeleteConfirm(thread: GhostThreadSummary): void {
    this.confirmDeleteThread.set(thread);
  }

  deleteThreadConfirmed(): void {
    const thread = this.confirmDeleteThread();
    if (!thread) {
      return;
    }

    this.deleteBusyThreadId.set(thread.thread_id);
    this.ghostChatService.deleteThread(thread.thread_id).subscribe(() => {
      this.deleteBusyThreadId.set('');
      this.confirmDeleteThread.set(null);
      this.refresh();
    });
  }

  trackByThread(_index: number, thread: GhostThreadSummary): string {
    return thread.thread_id;
  }

  formatDateTime(value?: string | null): string {
    if (!value) return 'Not available';
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) {
      return 'Not available';
    }
    return date.toLocaleString([], {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
