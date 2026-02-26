import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { CommunityPost, CommunityService } from '../../../../core/services/community.service';
import { GhostChatService } from '../../../../core/services/ghost-chat.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-community',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  styles: [`
    .chat-font {
      font-family: 'Google Sans', 'Segoe UI', sans-serif;
    }
  `],
  template: `
    <div class="min-h-screen flex flex-col chat-font bg-surface-2">
      <header class="sticky top-0 z-20 px-3 pt-4 pb-3 border-b border-border bg-surface/85 backdrop-blur-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
        <div class="max-w-4xl mx-auto">
          <div class="rounded-xl border-2 px-4 py-3 flex items-center justify-between gap-2 bg-surface shadow-sm border-primary/20">
            <div class="flex items-center gap-2 min-w-0">
              <a [routerLink]="backRoute()" class="text-secondary hover:text-primary shrink-0" aria-label="Back">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
              </a>
              <h1 class="text-sm sm:text-base font-semibold text-primary truncate lowercase">{{ headerTitle() }}</h1>
            </div>
            <p class="text-xs sm:text-sm font-semibold shrink-0 text-success">(members active:{{ memberCountDisplay() }})</p>
          </div>
          <div class="flex items-center justify-between mt-3 gap-2 px-1">
            <p class="text-xs font-medium text-secondary truncate">Public group chat. Everyone can see these messages.</p>
            <button
              type="button"
              (click)="refreshFeed()"
              [disabled]="loading()"
              class="px-3 py-1.5 rounded-lg border border-border bg-surface text-[11px] font-semibold text-primary hover:border-primary transition-colors disabled:opacity-60 shadow-sm">
              {{ loading() ? 'Loading...' : 'Refresh' }}
            </button>
          </div>
        </div>
      </header>

      <main class="flex-1 overflow-y-auto px-3 py-3">
        <div class="max-w-4xl mx-auto space-y-3 pb-32">
          <section class="rounded-xl border border-border bg-white p-3">
            <p class="text-[11px] text-secondary font-semibold mb-1">Safety Rules</p>
            <p *ngFor="let rule of safetyRules()" class="text-[11px] text-secondary leading-relaxed">• {{ rule }}</p>
          </section>

          <section *ngIf="feed().length === 0 && !loading()" class="rounded-xl border border-border bg-white p-6 text-center text-secondary text-sm">
            No public messages yet. Ask your first question.
          </section>

          <article *ngFor="let entry of feed()" class="space-y-2">
            <div class="flex items-end gap-2" [ngClass]="isOwnPost(entry.post) ? 'justify-end' : 'justify-start'">
              <div
                *ngIf="!isOwnPost(entry.post)"
                class="h-9 w-9 rounded-full border border-border bg-white flex items-center justify-center text-xs font-semibold text-primary shrink-0"
                [attr.title]="avatarInfo(entry.post)">
                {{ avatarLabel(entry.post.author_name) }}
              </div>

              <div class="max-w-[84%]">
                <div class="rounded-2xl border px-3 py-2 shadow-sm"
                  [ngClass]="isOwnPost(entry.post) ? 'bg-[#d9fdd3] border-[#bfe7b7]' : 'bg-white border-border'">
                  <div class="flex items-center gap-1.5 mb-1">
                    <p class="text-[11px] font-semibold"
                      [ngClass]="isOwnPost(entry.post) ? 'text-[#005c4b]' : 'text-primary'">
                      {{ isOwnPost(entry.post) ? 'You' : entry.post.author_name }}
                    </p>
                    
                    <button 
                      *ngIf="!isAgentView() && !isOwnPost(entry.post) && isGhostPost(entry.post)"
                      type="button" 
                      (click)="startDirectMessage(entry.post.persona_id!)"
                      [disabled]="dmInProgress() === entry.post.persona_id"
                      class="ml-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/5 border border-primary/20 text-[10px] font-semibold text-primary hover:bg-primary/10 hover:border-primary/40 transition-colors disabled:opacity-50"
                      title="Direct Message">
                      <svg *ngIf="dmInProgress() !== entry.post.persona_id" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                      <div *ngIf="dmInProgress() === entry.post.persona_id" class="w-2.5 h-2.5 rounded-full border border-primary/20 border-t-primary animate-spin"></div>
                      Message
                    </button>
                  </div>
                  <p *ngIf="isGhostPost(entry.post) && entry.post.ghost_member_info" class="text-[11px] text-secondary mb-1">
                    {{ entry.post.ghost_member_info }}
                  </p>

                  <p *ngIf="entry.post.content" class="text-sm text-primary whitespace-pre-wrap">{{ entry.post.content }}</p>

                  <div *ngIf="entry.post.mediaUrl" class="mt-2 rounded-xl border border-black/10 overflow-hidden bg-surface-2">
                    <img *ngIf="isImage(entry.post.mediaName, entry.post.mediaUrl)" [src]="entry.post.mediaUrl" class="w-full max-h-64 object-cover" alt="community media" />
                    <video *ngIf="isVideo(entry.post.mediaName, entry.post.mediaUrl)" [src]="entry.post.mediaUrl" class="w-full max-h-64 bg-black" controls></video>
                    <div *ngIf="!isImage(entry.post.mediaName, entry.post.mediaUrl) && !isVideo(entry.post.mediaName, entry.post.mediaUrl)" class="px-3 py-2 text-xs text-secondary">
                      {{ entry.post.mediaName || 'Attachment' }}
                    </div>
                  </div>

                  <p *ngIf="entry.post.content_masked" class="text-[11px] text-warning mt-1">Sensitive contact details were masked.</p>
                </div>
                <p class="text-[10px] text-muted mt-1" [ngClass]="isOwnPost(entry.post) ? 'text-right' : 'text-left'">
                  {{ formatDateTime(entry.post.created_at) }}
                </p>
              </div>
            </div>

            <div *ngIf="entry.replies.length > 0" class="space-y-2 pl-7 sm:pl-11">
              <div *ngFor="let reply of entry.replies" class="flex items-end gap-2">
                <div
                  class="h-8 w-8 rounded-full border border-border bg-white flex items-center justify-center text-[10px] font-semibold text-primary shrink-0"
                  [attr.title]="avatarInfo(reply)">
                  {{ avatarLabel(reply.author_name) }}
                </div>
                <div class="max-w-[80%]">
                  <div class="rounded-2xl border border-border bg-white px-3 py-2 shadow-sm">
                    <div class="flex items-center gap-1.5 mb-1">
                      <p class="text-[11px] font-semibold text-primary mb-1">{{ reply.author_name }}</p>
                      
                      <button 
                        *ngIf="!isAgentView() && !isOwnPost(reply) && isGhostPost(reply)"
                        type="button" 
                        (click)="startDirectMessage(reply.persona_id!)"
                        [disabled]="dmInProgress() === reply.persona_id"
                        class="ml-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/5 border border-primary/20 text-[10px] font-semibold text-primary hover:bg-primary/10 hover:border-primary/40 transition-colors disabled:opacity-50"
                        title="Direct Message">
                        <svg *ngIf="dmInProgress() !== reply.persona_id" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        <div *ngIf="dmInProgress() === reply.persona_id" class="w-2.5 h-2.5 rounded-full border border-primary/20 border-t-primary animate-spin"></div>
                        Message
                      </button>
                    </div>

                    <p *ngIf="isGhostPost(reply) && reply.ghost_member_info" class="text-[11px] text-secondary mb-1">
                      {{ reply.ghost_member_info }}
                    </p>
                    <p *ngIf="reply.content" class="text-sm text-primary whitespace-pre-wrap">{{ reply.content }}</p>

                    <div *ngIf="reply.mediaUrl" class="mt-2 rounded-xl border border-black/10 overflow-hidden bg-surface-2">
                      <img *ngIf="isImage(reply.mediaName, reply.mediaUrl)" [src]="reply.mediaUrl" class="w-full max-h-64 object-cover" alt="community reply media" />
                      <video *ngIf="isVideo(reply.mediaName, reply.mediaUrl)" [src]="reply.mediaUrl" class="w-full max-h-64 bg-black" controls></video>
                      <div *ngIf="!isImage(reply.mediaName, reply.mediaUrl) && !isVideo(reply.mediaName, reply.mediaUrl)" class="px-3 py-2 text-xs text-secondary">
                        {{ reply.mediaName || 'Attachment' }}
                      </div>
                    </div>

                    <p *ngIf="reply.content_masked" class="text-[11px] text-warning mt-1">Sensitive contact details were masked.</p>
                  </div>
                  <p class="text-[10px] text-muted mt-1">{{ formatDateTime(reply.created_at) }}</p>
                </div>
              </div>
            </div>
          </article>
        </div>
      </main>

      <footer class="sticky bottom-0 border-t border-border bg-white/95 backdrop-blur px-3 py-3">
        <div class="max-w-4xl mx-auto">
          <div *ngIf="isAgentView()" class="mb-4 p-3 rounded-xl border-2 border-primary/20 bg-primary/5">
            <div class="flex items-center gap-3">
              <div class="flex-1">
                 <label class="block text-[11px] font-bold text-primary uppercase tracking-wider mb-1.5">Posting Identity (Agent Only)</label>
                 <select
                   [(ngModel)]="selectedGhostMemberId"
                   class="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:border-primary shadow-sm font-medium">
                   <option [ngValue]="0">Select Ghost Member to post as...</option>
                   <option *ngFor="let member of personas(); trackBy: trackByGhostMember" [ngValue]="member.id">
                     {{ member.display_name }} ({{ member.ghost_id }})
                   </option>
                 </select>
              </div>
              <div class="pt-5 hidden sm:block">
                 <a
                   routerLink="/agent/ghost-setup"
                   class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface border border-border text-xs font-semibold text-primary no-underline hover:bg-surface-2 shadow-sm transition-colors">
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                   Setup
                 </a>
              </div>
            </div>
            <p *ngIf="isAgentView() && !selectedGhostMemberId" class="mt-2 text-[11px] font-medium text-error flex items-center gap-1">
               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
               You must select a Ghost Member to send messages as an Agent.
            </p>
          </div>

          <div *ngIf="selectedPublicMediaName()" class="mb-2 flex items-center justify-between gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2">
            <p class="text-xs text-primary truncate">Attachment: {{ selectedPublicMediaName() }}</p>
            <button type="button" (click)="clearSelectedPublicMedia()" class="text-xs text-error">Remove</button>
          </div>

          <p *ngIf="restrictedQuestion()" class="text-[11px] text-error mb-2">
            Phone number or email detected. Remove personal contact details before sending.
          </p>

          <div class="flex items-center gap-2">
            <input type="file" #publicFile class="hidden" (change)="onPublicMediaSelected($event)" accept="image/*,video/*,.pdf,.txt">
            <button
              type="button"
              (click)="publicFile.click()"
              class="h-11 w-11 rounded-full border border-border bg-surface-2 text-primary flex items-center justify-center shrink-0"
              title="Attach media">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
              </svg>
            </button>

            <div class="flex-1 rounded-full border border-border bg-surface-2 px-4 py-2.5">
              <input
                [(ngModel)]="questionDraft"
                (keyup.enter)="submitQuestion()"
                type="text"
                [placeholder]="composerPlaceholder()"
                class="w-full bg-transparent border-none outline-none text-sm text-primary placeholder:text-muted" />
            </div>

            <button
              type="button"
              (click)="submitQuestion()"
              [disabled]="isSendDisabled()"
              class="h-11 w-11 rounded-full flex items-center justify-center shrink-0"
              [ngClass]="isSendDisabled() ? 'bg-surface-3 text-muted' : 'bg-[#ff8f00] text-white'">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      </footer>
    </div>
  `
})
export class CommunityComponent implements OnInit, OnDestroy {
  private communityService = inject(CommunityService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  questionDraft = '';
  loading = signal<boolean>(false);
  posting = signal<boolean>(false);
  currentUserId = signal<string>('');
  isAgentView = signal<boolean>(false);
  backRoute = signal<string>('/dashboard');
  selectedPublicMedia = signal<File | null>(null);

  selectedGhostMemberId = 0;

  feed = this.communityService.feed;
  personas = this.communityService.personas;
  settings = this.communityService.settings;
  safetyRules = this.communityService.safetyRules;

  restrictedQuestion = computed(() => CommunityService.hasRestrictedContact(this.questionDraft));
  selectedPublicMediaName = computed(() => this.selectedPublicMedia()?.name || '');
  headerTitle = computed(() => String(this.settings().community_title || 'community chat.').trim() || 'community chat.');
  memberCountDisplay = computed(() => Number(this.settings().active_members_display || 89));
  composerPlaceholder = computed(() => this.isAgentView() ? 'Type public message as selected ghost member' : 'Type your public message');

  dmInProgress = signal<number>(0);

  private poller: number | null = null;
  private router = inject(Router); // Injected Router

  constructor(
    private ghostChatService: GhostChatService,
  ) { }

  ngOnInit(): void {
    const user = this.authService.currentUserSignal();
    if (user?.id != null) {
      this.currentUserId.set(String(user.id));
    }

    const isAgent = user?.role === 'vendor';
    this.isAgentView.set(isAgent);
    this.backRoute.set(isAgent ? '/agent' : '/dashboard');

    this.refreshFeed();
    this.poller = window.setInterval(() => this.communityService.loadFeed().subscribe(), 5000);
  }

  ngOnDestroy(): void {
    if (this.poller !== null) {
      window.clearInterval(this.poller);
      this.poller = null;
    }
  }

  refreshFeed(): void {
    this.loading.set(true);
    this.communityService.loadFeed().subscribe(() => {
      this.loading.set(false);
      if (this.isAgentView()) {
        this.communityService.loadGhostMembers().subscribe();
      }
    });
  }

  submitQuestion(): void {
    const text = this.questionDraft.trim();
    const mediaFile = this.selectedPublicMedia();
    if ((!text && !mediaFile) || this.restrictedQuestion()) {
      return;
    }

    this.posting.set(true);
    if (this.isAgentView()) {
      const ghostMemberId = Number(this.selectedGhostMemberId || 0);
      if (!Number.isFinite(ghostMemberId) || ghostMemberId <= 0) {
        this.posting.set(false);
        this.notificationService.warning('Select a Ghost Member before sending message.');
        return;
      }

      this.communityService.postAsGhostMember({
        content: text,
        ghost_member_id: ghostMemberId,
        mediaFile
      }).subscribe((ok) => this.handlePostResult(ok, true));
      return;
    }

    this.communityService.postQuestion(text, mediaFile).subscribe((ok) => this.handlePostResult(ok, false));
  }

  private handlePostResult(ok: boolean, clearGhostSelection: boolean): void {
    this.posting.set(false);
    if (!ok) {
      this.notificationService.error('Message could not be sent. Please try again.');
      return;
    }
    this.questionDraft = '';
    this.clearSelectedPublicMedia();
    if (clearGhostSelection) {
      this.selectedGhostMemberId = 0;
    }
  }

  onPublicMediaSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    this.selectedPublicMedia.set(file);
    input.value = '';
  }

  clearSelectedPublicMedia(): void {
    this.selectedPublicMedia.set(null);
  }

  isOwnPost(post: CommunityPost): boolean {
    const currentId = this.currentUserId();
    return !!currentId && !!post.user_id && currentId === post.user_id;
  }

  isGhostPost(post: CommunityPost): boolean {
    return post.author_type === 'persona' && !!post.ghost_member_id;
  }

  avatarInfo(post: CommunityPost): string {
    const name = String(post.author_name || 'Community member').trim();
    const info = String(post.ghost_member_info || '').trim();
    return info ? `${name} - ${info}` : name;
  }

  avatarLabel(name: string): string {
    const clean = String(name || '').trim();
    return clean ? clean[0].toUpperCase() : 'U';
  }

  isImage(name?: string, url?: string): boolean {
    const source = `${name || ''} ${url || ''}`.toLowerCase();
    return /(png|jpg|jpeg|gif|webp)/.test(source);
  }

  isVideo(name?: string, url?: string): boolean {
    const source = `${name || ''} ${url || ''}`.toLowerCase();
    return /(mp4|webm|ogg|mov)/.test(source);
  }

  isSendDisabled(): boolean {
    if (this.posting()) return true;
    if (!this.questionDraft.trim() && !this.selectedPublicMedia()) return true;
    if (this.restrictedQuestion()) return true;
    if (this.isAgentView() && this.selectedGhostMemberId <= 0) return true;
    return false;
  }

  trackByGhostMember(_index: number, member: { id: number }): number {
    return member.id;
  }

  formatDateTime(value: string): string {
    const ts = new Date(value);
    if (!Number.isFinite(ts.getTime())) {
      return '-';
    }
    return ts.toLocaleString([], {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  startDirectMessage(personaId: number): void {
    if (this.dmInProgress() || !personaId) return;

    this.dmInProgress.set(personaId);
    this.ghostChatService.createThreadForPersona(personaId).subscribe({
      next: (thread) => {
        this.dmInProgress.set(0);
        if (thread?.thread_id) {
          // Successfully created or retrieved the DM thread, instantly tunnel the user to their inbox
          this.router.navigate(['/dashboard/messages'], { queryParams: { thread: thread.thread_id } });
        } else {
          this.notificationService.error('Failed to start direct message. Please try again later.');
        }
      },
      error: () => {
        this.dmInProgress.set(0);
        this.notificationService.error('An error occurred. Please try again.');
      }
    });
  }
}
