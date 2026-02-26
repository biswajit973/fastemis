import { AfterViewChecked, Component, ElementRef, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommunityService } from '../../../../core/services/community.service';
import { GhostChatService, GhostMessage, GhostThreadSummary } from '../../../../core/services/ghost-chat.service';

@Component({
  selector: 'app-agent-chat-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pb-6" *ngIf="ready(); else loadingState">
      <div class="mb-4 flex items-center justify-between gap-4">
        <div>
          <a routerLink="/agent/chats" class="text-sm text-secondary hover:text-primary no-underline inline-flex items-center gap-2 mb-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Back to Ghost Chats
          </a>
          <h1 class="text-2xl font-bold text-primary">Ghost Chat Workspace</h1>
          <div class="mt-1 flex flex-wrap items-center gap-2">
            <span class="px-2.5 py-1 rounded-full bg-surface-2 text-xs text-primary border border-border">
              Real User: {{ activeThread()?.user_name || 'User' }}
            </span>
            <span class="px-2.5 py-1 rounded-full bg-primary/10 text-xs text-primary border border-primary/20">
              Ghost Member: {{ activeThread()?.persona?.display_name }}
            </span>
            <span class="px-2.5 py-1 rounded-full bg-surface-2 text-xs text-secondary border border-border" *ngIf="activeThread()?.persona?.ghost_id">
              ghost_id: {{ activeThread()?.persona?.ghost_id }}
            </span>
            <span class="px-2.5 py-1 rounded-full bg-surface-2 text-xs text-secondary border border-border" *ngIf="activeThread()?.persona?.identity_tag">
              tag: {{ activeThread()?.persona?.identity_tag }}
            </span>
            <span class="px-2.5 py-1 rounded-full bg-surface-2 text-xs text-secondary border border-border" *ngIf="activeThread()?.persona?.info">
              info: {{ activeThread()?.persona?.info }}
            </span>
          </div>
        </div>
        <button
          type="button"
          (click)="confirmThreadDelete.set(true)"
          [disabled]="deletingThread()"
          class="px-3 py-2 rounded-lg border border-error text-error text-sm font-medium hover:bg-error/10 disabled:opacity-60">
          {{ deletingThread() ? 'Deleting...' : 'Delete Entire Chat' }}
        </button>
      </div>

      <section class="rounded-xl border border-border bg-surface p-4 mb-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p class="text-xs text-secondary mb-1">Current Persona</p>
            <select [(ngModel)]="selectedPersonaId" class="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:border-primary">
              <option *ngFor="let persona of personas()" [value]="persona.id">{{ persona.display_name }}</option>
            </select>
          </div>

          <div class="flex items-end">
            <label class="inline-flex items-center gap-2 text-sm text-primary">
              <input type="checkbox" [(ngModel)]="threadLocked" />
              Lock persona for this thread
            </label>
          </div>

          <div class="flex items-end justify-start md:justify-end gap-2">
            <label class="inline-flex items-center gap-2 text-xs text-secondary">
              <input type="checkbox" [(ngModel)]="adminOverride" />
              Admin override
            </label>
            <button
              type="button"
              (click)="saveThreadSettings()"
              [disabled]="savingSettings()"
              class="px-3 py-2 rounded-lg border border-border text-sm text-primary hover:bg-surface-2 disabled:opacity-60">
              {{ savingSettings() ? 'Saving...' : 'Save Thread Settings' }}
            </button>
          </div>
        </div>
      </section>

      <div class="rounded-xl border border-border bg-surface overflow-hidden">
        <div class="p-4 border-b border-border flex items-center justify-between gap-2">
          <div>
            <p class="text-sm font-semibold text-primary">Conversation</p>
            <p class="text-[11px] text-secondary">Delete is available to agent only (for everyone).</p>
          </div>
          <button type="button" (click)="showMediaGallery.set(!showMediaGallery())" class="px-2.5 py-1 rounded border border-border text-xs text-primary">
            Media ({{ sharedMedia().length }})
          </button>
        </div>

        <div class="relative h-[calc(100vh-21rem)]">
          <div *ngIf="!showMediaGallery()" class="h-full overflow-y-auto p-4 space-y-3" #scrollContainer>
            <div *ngFor="let msg of messagesState()" class="flex flex-col max-w-[85%] relative"
              [ngClass]="{
                'self-start items-start': msg.sender === 'user',
                'self-end items-end': msg.sender === 'agent',
                'mx-auto text-center !max-w-full': msg.sender === 'system'
              }">

              <ng-container *ngIf="msg.sender !== 'system'">
                <div class="text-[10px] text-muted mb-1">
                  {{ msg.sender === 'agent'
                      ? (msg.senderName || activeThread()?.persona?.display_name)
                      : (msg.senderName || activeThread()?.user_name || 'User') }}
                </div>
                <div class="relative p-3 rounded-2xl shadow-sm text-sm border"
                  [ngClass]="{
                    'bg-surface text-primary border-border rounded-tl-sm': msg.sender === 'user',
                    'bg-primary text-white border-primary/60 rounded-tr-sm': msg.sender === 'agent',
                    '!border-error ring-2 ring-error/20': deleteTargetId() === msg.id
                  }">
                  <button
                    *ngIf="msg.canDelete"
                    type="button"
                    (click)="requestDelete(msg.id)"
                    class="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-error text-white flex items-center justify-center shadow-sm border-2 border-surface">
                    X
                  </button>

                  <span *ngIf="msg.type === 'text'" class="whitespace-pre-wrap">{{ msg.content }}</span>
                  <div *ngIf="msg.type === 'media'" class="space-y-2">
                    <img *ngIf="msg.mediaUrl && isImage(msg.mediaName)" [src]="msg.mediaUrl" class="rounded max-h-56 object-cover">
                    <video *ngIf="msg.mediaUrl && isVideo(msg.mediaName)" [src]="msg.mediaUrl" controls class="rounded max-h-56 bg-black"></video>
                    <div *ngIf="!msg.mediaUrl || (!isImage(msg.mediaName) && !isVideo(msg.mediaName))" class="text-xs bg-black/10 rounded px-2 py-1">
                      {{ msg.mediaName || 'Attachment' }}
                    </div>
                    <button type="button" (click)="openMediaPreview(msg)" class="inline-flex items-center gap-1 rounded-full border border-current/30 px-2 py-1 text-[10px]">
                      Preview
                    </button>
                  </div>
                </div>
                <p class="text-[10px] text-muted mt-1">{{ formatDateTime(msg.timestamp) }}</p>
              </ng-container>

              <ng-container *ngIf="msg.sender === 'system'">
                <div class="bg-surface-3 border border-border text-secondary text-xs px-3 py-2 rounded-lg">{{ msg.content }}</div>
              </ng-container>
            </div>
          </div>

          <div *ngIf="showMediaGallery()" class="h-full overflow-y-auto p-4 bg-surface grid grid-cols-1 sm:grid-cols-2 gap-4">
            <article *ngFor="let media of sharedMedia()" class="border border-border rounded-xl overflow-hidden bg-surface-2 relative">
              <img *ngIf="media.mediaUrl && isImage(media.mediaName)" [src]="media.mediaUrl" class="w-full h-40 object-cover" />
              <video *ngIf="media.mediaUrl && isVideo(media.mediaName)" [src]="media.mediaUrl" class="w-full h-40 object-cover bg-black" controls></video>
              <div *ngIf="!media.mediaUrl || (!isImage(media.mediaName) && !isVideo(media.mediaName))" class="h-40 flex items-center justify-center text-secondary text-xs">{{ media.mediaName || 'Attachment' }}</div>
              <button *ngIf="media.canDelete" type="button" (click)="requestDelete(media.id)" class="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 bg-error text-white w-7 h-7 rounded-full border-2 border-surface">X</button>
              <div class="px-3 py-2 border-t border-border">
                <p class="text-[11px] text-primary truncate">{{ media.mediaName || 'Attachment' }}</p>
                <p class="text-[10px] text-secondary">{{ formatDateTime(media.timestamp) }}</p>
              </div>
            </article>
            <p *ngIf="sharedMedia().length === 0" class="col-span-full text-center text-secondary text-sm py-8">No shared media.</p>
          </div>
        </div>

        <footer class="p-3 border-t border-border flex items-center gap-2">
          <input type="file" #fileInput class="hidden" (change)="onFileSelected($event)" accept="image/*,video/*,.pdf,.txt">
          <button type="button" (click)="fileInput.click()" class="w-10 h-10 rounded-full text-secondary hover:bg-surface-3 flex items-center justify-center">+</button>
          <div class="flex-1 bg-surface-2 rounded-full border border-border px-4 py-2">
            <input type="text" [(ngModel)]="newMessage" (keyup.enter)="sendMessage()" [placeholder]="'Reply as ' + (activeThread()?.persona?.display_name || 'persona')" class="w-full bg-transparent border-none outline-none text-sm text-primary" />
          </div>
          <button type="button" (click)="sendMessage()" [disabled]="!newMessage.trim()" class="w-10 h-10 rounded-full bg-primary text-white disabled:opacity-60">→</button>
        </footer>
      </div>
    </div>

    <div *ngIf="deleteTargetId()" class="fixed inset-0 z-[95] bg-black/45 backdrop-blur-[1px] flex items-center justify-center p-4">
      <div class="w-full max-w-sm rounded-2xl border border-border bg-surface shadow-xl p-5">
        <h3 class="text-lg font-semibold text-primary mb-1">Delete Message</h3>
        <p class="text-sm text-secondary mb-4">Are you sure you want to delete?</p>
        <div class="flex items-center justify-end gap-2">
          <button type="button" (click)="cancelDelete()" class="px-3 py-2 rounded-lg border border-border text-secondary">Cancel</button>
          <button type="button" (click)="confirmDelete()" [disabled]="deleteBusy()" class="px-3 py-2 rounded-lg bg-error text-white disabled:opacity-60">{{ deleteBusy() ? 'Deleting...' : 'Delete' }}</button>
        </div>
      </div>
    </div>

    <div *ngIf="confirmThreadDelete()" class="fixed inset-0 z-[95] bg-black/45 backdrop-blur-[1px] flex items-center justify-center p-4">
      <div class="w-full max-w-sm rounded-2xl border border-border bg-surface shadow-xl p-5">
        <h3 class="text-lg font-semibold text-primary mb-1">Delete Entire Private Chat</h3>
        <p class="text-sm text-secondary mb-4">This removes complete conversation for this user and persona thread.</p>
        <div class="flex items-center justify-end gap-2">
          <button type="button" (click)="confirmThreadDelete.set(false)" class="px-3 py-2 rounded-lg border border-border text-secondary">Cancel</button>
          <button
            type="button"
            (click)="deleteThreadConfirmed()"
            [disabled]="deletingThread()"
            class="px-3 py-2 rounded-lg bg-error text-white disabled:opacity-60">
            {{ deletingThread() ? 'Deleting...' : 'Delete Chat' }}
          </button>
        </div>
      </div>
    </div>

    <div *ngIf="previewMedia()" class="fixed inset-0 z-[96] bg-black/85 p-4 flex flex-col">
      <div class="flex items-center justify-between text-white mb-3">
        <div>
          <p class="text-sm font-medium">{{ previewMedia()?.mediaName || 'Attachment' }}</p>
          <p class="text-xs text-white/70">{{ formatDateTime(previewMedia()?.timestamp || '') }}</p>
        </div>
        <button type="button" (click)="closeMediaPreview()" class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">X</button>
      </div>
      <div class="flex-1 rounded-xl border border-white/20 bg-black/30 p-2 flex items-center justify-center overflow-hidden">
        <img *ngIf="previewMedia()?.mediaUrl && isImage(previewMedia()?.mediaName)" [src]="previewMedia()?.mediaUrl || ''" class="max-h-full max-w-full object-contain rounded" alt="preview" />
        <video *ngIf="previewMedia()?.mediaUrl && isVideo(previewMedia()?.mediaName)" [src]="previewMedia()?.mediaUrl || ''" controls autoplay class="max-h-full max-w-full rounded"></video>
      </div>
    </div>

    <ng-template #loadingState>
      <div class="px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto py-16 text-center">
        <div class="w-8 h-8 rounded-full border-2 border-surface-3 border-t-primary animate-spin mx-auto mb-4"></div>
        <p class="text-secondary">Loading ghost chat workspace...</p>
      </div>
    </ng-template>
  `
})
export class AgentChatPageComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('scrollContainer') private scrollContainer?: ElementRef;

  ready = signal<boolean>(false);
  threadId = signal<string>('');
  activeThread = signal<GhostThreadSummary | null>(null);
  personas = signal<{ id: number; display_name: string }[]>([]);
  messagesState = signal<GhostMessage[]>([]);

  showMediaGallery = signal<boolean>(false);
  previewMedia = signal<GhostMessage | null>(null);
  deleteTargetId = signal<string>('');
  deleteBusy = signal<boolean>(false);
  confirmThreadDelete = signal<boolean>(false);
  deletingThread = signal<boolean>(false);
  savingSettings = signal<boolean>(false);

  selectedPersonaId = 0;
  threadLocked = true;
  adminOverride = false;

  newMessage = '';

  private messagesPoller: number | null = null;
  private threadPoller: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ghostChatService: GhostChatService,
    private communityService: CommunityService
  ) {}

  ngOnInit(): void {
    const id = String(this.route.snapshot.paramMap.get('userId') || '').trim();
    if (!id) {
      this.router.navigate(['/agent/chats']);
      return;
    }

    this.threadId.set(id);
    this.initializeThread();
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  ngOnDestroy(): void {
    if (this.messagesPoller !== null) {
      window.clearInterval(this.messagesPoller);
      this.messagesPoller = null;
    }
    if (this.threadPoller !== null) {
      window.clearInterval(this.threadPoller);
      this.threadPoller = null;
    }
  }

  initializeThread(): void {
    this.communityService.loadPersonas().subscribe((personas) => {
      this.personas.set(personas.map((item) => ({ id: item.id, display_name: item.display_name })));
    });

    this.ghostChatService.loadAgentThreads().subscribe((threads) => {
      const found = threads.find((thread) => thread.thread_id === this.threadId()) || null;
      if (!found) {
        this.router.navigate(['/agent/chats']);
        return;
      }

      this.bindThread(found);
      this.ready.set(true);
      this.refreshMessages(false);

      this.messagesPoller = window.setInterval(() => this.refreshMessages(true), 6000);
      this.threadPoller = window.setInterval(() => this.refreshThreadMeta(), 9000);
    });
  }

  saveThreadSettings(): void {
    const thread = this.activeThread();
    if (!thread) {
      return;
    }

    this.savingSettings.set(true);
    this.ghostChatService.updateThread(thread.thread_id, {
      persona_id: this.selectedPersonaId || undefined,
      is_persona_locked: this.threadLocked,
      admin_override: this.adminOverride
    }).subscribe((updated) => {
      this.savingSettings.set(false);
      if (!updated) {
        return;
      }
      this.bindThread({ ...thread, ...updated, persona: updated.persona || thread.persona });
      this.refreshThreadMeta();
    });
  }

  sendMessage(): void {
    const thread = this.activeThread();
    const text = this.newMessage.trim();
    if (!thread || !text) {
      return;
    }

    this.newMessage = '';
    this.ghostChatService.sendTextMessage(thread.thread_id, text).subscribe(() => {
      this.refreshMessages(true);
      this.refreshThreadMeta();
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const thread = this.activeThread();
    if (!file || !thread) {
      return;
    }

    this.ghostChatService.sendMediaMessage(thread.thread_id, file).subscribe(() => {
      this.refreshMessages(true);
      this.refreshThreadMeta();
      input.value = '';
    });
  }

  requestDelete(messageId: string): void {
    this.deleteTargetId.set(messageId);
  }

  cancelDelete(): void {
    this.deleteBusy.set(false);
    this.deleteTargetId.set('');
  }

  confirmDelete(): void {
    const thread = this.activeThread();
    const messageId = this.deleteTargetId();
    if (!thread || !messageId) {
      return;
    }

    this.deleteBusy.set(true);
    this.ghostChatService.deleteMessageForEveryone(thread.thread_id, messageId).subscribe(() => {
      this.deleteBusy.set(false);
      this.deleteTargetId.set('');
      this.refreshMessages(true);
      this.refreshThreadMeta();
    });
  }

  deleteThreadConfirmed(): void {
    const thread = this.activeThread();
    if (!thread) {
      return;
    }

    this.deletingThread.set(true);
    this.ghostChatService.deleteThread(thread.thread_id).subscribe((ok) => {
      this.deletingThread.set(false);
      if (!ok) {
        return;
      }
      this.confirmThreadDelete.set(false);
      this.router.navigate(['/agent/chats']);
    });
  }

  sharedMedia(): GhostMessage[] {
    return this.messagesState().filter((item) => item.type === 'media');
  }

  openMediaPreview(message: GhostMessage): void {
    this.previewMedia.set(message);
  }

  closeMediaPreview(): void {
    this.previewMedia.set(null);
  }

  isImage(name?: string): boolean {
    return !!name && /(png|jpg|jpeg|gif|webp)$/i.test(name);
  }

  isVideo(name?: string): boolean {
    return !!name && /(mp4|webm|ogg|mov)$/i.test(name);
  }

  formatDateTime(value?: string | null): string {
    if (!value) return '-';
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) {
      return '-';
    }
    return date.toLocaleString([], {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private bindThread(thread: GhostThreadSummary): void {
    this.activeThread.set(thread);
    this.selectedPersonaId = thread.persona.id;
    this.threadLocked = !!thread.is_persona_locked;
  }

  private refreshThreadMeta(): void {
    this.ghostChatService.loadAgentThreads().subscribe((threads) => {
      const found = threads.find((thread) => thread.thread_id === this.threadId()) || null;
      if (!found) {
        return;
      }
      this.bindThread(found);
    });
  }

  private refreshMessages(incremental: boolean): void {
    const thread = this.activeThread();
    if (!thread) {
      return;
    }

    this.ghostChatService.fetchMessages(thread.thread_id, { forceFull: !incremental }).subscribe((messages) => {
      this.messagesState.set(messages);
    });
  }

  private scrollToBottom(): void {
    try {
      if (this.scrollContainer && !this.showMediaGallery()) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch {
      // no-op
    }
  }
}
