import { AfterViewChecked, Component, ElementRef, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommunityService } from '../../../../core/services/community.service';

@Component({
    selector: 'app-agent-community',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
    <div
      class="w-full md:px-6 lg:px-8 max-w-6xl mx-auto"
      [ngClass]="isFullscreen()
        ? 'fixed inset-0 z-[70] max-w-none px-0 bg-surface'
        : 'h-[calc(100vh-4rem)] md:h-[calc(100vh-8rem)]'">

      <div
        class="bg-surface border border-border shadow-xl h-full overflow-hidden flex flex-col"
        [ngClass]="isFullscreen() ? 'rounded-none border-0' : 'md:rounded-2xl'">

        <!-- Header -->
        <header class="shrink-0 bg-primary text-white px-3 py-2.5 md:px-5 md:py-3 flex items-center justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <a *ngIf="!isFullscreen()" routerLink="/agent" class="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            </a>

            <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold shrink-0">FC</div>
            <div class="min-w-0">
              <h1 class="font-semibold text-sm md:text-base truncate">FastEMIs Community Group</h1>
              <p class="text-[11px] md:text-xs text-white/80 truncate">{{ communityService.messages().length }} messages • moderation live</p>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <button
              (click)="toggleFullscreen()"
              class="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
              [attr.title]="isFullscreen() ? 'Exit full screen' : 'Open full screen'">
              <svg *ngIf="!isFullscreen()" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
              <svg *ngIf="isFullscreen()" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
            </button>

            <button (click)="scrollToBottom()" class="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors" title="Latest messages">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="7 13 12 18 17 13"></polyline><polyline points="7 6 12 11 17 6"></polyline></svg>
            </button>
          </div>
        </header>

        <!-- Messages -->
        <main class="flex-1 overflow-y-auto px-2 py-3 md:px-4 md:py-4 bg-gradient-to-b from-surface-2 to-surface">
          <div class="max-w-4xl mx-auto">
            <div class="text-center mb-3">
              <span class="inline-flex items-center px-3 py-1 rounded-full text-[10px] md:text-xs font-medium text-secondary bg-surface border border-border">
                Community feed auto-sync
              </span>
            </div>

            <div class="space-y-3" #scrollContainer>
              <div *ngFor="let msg of communityService.messages()"
                   class="flex"
                   [ngClass]="msg.senderRole === 'agent' ? 'justify-end' : 'justify-start'">

                <div class="max-w-[90%] sm:max-w-[78%] md:max-w-[68%]">
                  <div
                    class="text-[11px] text-muted mb-1 px-1 flex items-center"
                    [ngClass]="msg.senderRole === 'agent' ? 'justify-end' : 'justify-start'">
                    <span class="font-semibold truncate">{{ msg.username }}</span>
                  </div>

                  <div
                    class="rounded-2xl px-3 py-2.5 md:px-4 md:py-3 shadow-sm border"
                    [ngClass]="msg.senderRole === 'agent'
                      ? 'bg-[#DCF8C6] border-[#cbe9b4] text-[#1f2d16] rounded-tr-md'
                      : 'bg-white border-border text-primary rounded-tl-md'">
                    <p *ngIf="msg.type === 'text'" class="text-sm leading-relaxed break-words">{{ msg.content }}</p>

                    <div *ngIf="msg.type === 'media'" class="space-y-2">
                      <img *ngIf="msg.mediaUrl" [src]="msg.mediaUrl" class="w-full rounded-lg border border-border object-cover max-h-72">
                      <div class="inline-flex items-center gap-2 text-xs font-mono bg-black/5 px-2 py-1 rounded">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                        {{ msg.mediaName }}
                      </div>
                    </div>

                    <div class="text-[10px] text-secondary/80 mt-1.5 text-right">{{ formatDateTime(msg.timestamp) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <!-- Composer -->
        <footer class="shrink-0 border-t border-border bg-surface p-2.5 md:p-3 pb-[max(env(safe-area-inset-bottom),0.7rem)]">
          <div class="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              [(ngModel)]="customAgentName"
              placeholder="Post as"
              class="sm:w-52 rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-primary focus:outline-none focus:border-primary" />

            <div class="flex-1 flex gap-2">
              <button
                (click)="simulateMediaUpload()"
                [disabled]="!customAgentName.trim()"
                class="px-3 rounded-xl border border-border text-secondary hover:text-primary hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Share media">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
              </button>

              <input
                type="text"
                [(ngModel)]="newMessage"
                (keyup.enter)="sendMessage()"
                placeholder="Type announcement or reply..."
                class="flex-1 rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-primary focus:outline-none focus:border-primary" />

              <button
                (click)="sendMessage()"
                [disabled]="!newMessage.trim() || !customAgentName.trim()"
                class="px-4 rounded-xl font-semibold text-sm transition-colors"
                [ngClass]="(newMessage.trim() && customAgentName.trim()) ? 'bg-primary text-white hover:bg-primary-light' : 'bg-surface-3 text-muted cursor-not-allowed'">
                Send
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  `
})
export class AgentCommunityComponent implements OnInit, AfterViewChecked {
    @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

    customAgentName: string = 'VerifyDesk';
    newMessage: string = '';
    isFullscreen = signal<boolean>(false);

    constructor(public communityService: CommunityService) { }

    ngOnInit() {
        this.scrollToBottom();
    }

    ngAfterViewChecked() {
        this.scrollToBottom();
    }

    toggleFullscreen() {
        this.isFullscreen.update(value => !value);
    }

    sendMessage() {
        if (!this.newMessage.trim() || !this.customAgentName.trim()) return;

        this.communityService.sendMessage({
            senderRole: 'agent',
            username: this.customAgentName.trim(),
            content: this.newMessage.trim(),
            type: 'text'
        });

        this.newMessage = '';
    }

    simulateMediaUpload() {
        if (!this.customAgentName.trim()) {
            alert('Please enter a username to post as first.');
            return;
        }

        this.communityService.sendMessage({
            senderRole: 'agent',
            username: this.customAgentName.trim(),
            content: 'Sharing updated agreement notes for everyone.',
            type: 'media',
            mediaName: 'TNC_Updated_V3.pdf'
        });
    }

    formatDateTime(value: string): string {
        return new Date(value).toLocaleString([], {
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    scrollToBottom(): void {
        try {
            this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
        } catch (err) { }
    }
}
