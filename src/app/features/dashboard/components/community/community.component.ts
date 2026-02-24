import { Component, OnInit, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommunityService, CommunityMessage } from '../../../../core/services/community.service';
import { AuthService } from '../../../../core/services/auth.service';
// Actually, let's just recreate a lightweight pipe here to avoid export/import tangles if it wasn't exported properly, or use a shared one.
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'communityTimeAgo', standalone: true })
export class CommunityTimeAgoPipe implements PipeTransform {
    transform(value: string | Date): string {
        if (!value) return '';
        const now = new Date().getTime();
        const then = new Date(value).getTime();
        const diff = Math.floor((now - then) / 1000);
        if (diff < 60) return 'Just now';
        if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
        if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
        const d = new Date(value);
        return d.toLocaleDateString();
    }
}

@Component({
    selector: 'app-community',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, CommunityTimeAgoPipe],
    template: `
    <div class="flex flex-col h-screen bg-surface-2">
      
      <!-- App Bar -->
      <header class="bg-surface border-b border-border h-16 flex items-center px-4 shrink-0 sticky top-0 z-20">
        <a routerLink="/dashboard" class="mr-4 text-secondary hover:text-primary transition-standard">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </a>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <div>
            <h2 class="font-bold text-primary leading-tight">Global FastEMIs Community</h2>
            <p class="text-xs text-secondary">{{ communityService.messages().length + 142 }} members online</p>
          </div>
        </div>
      </header>

      <!-- Chat Area -->
      <main class="flex-1 overflow-y-auto p-4 space-y-4" #scrollContainer>
        
        <div class="text-center mb-6">
          <span class="bg-surface border border-border px-3 py-1 rounded-full text-xs font-medium text-secondary shadow-sm">
            Welcome to the Community
          </span>
        </div>

        <div *ngFor="let msg of communityService.messages()" 
             class="flex flex-col max-w-[85%] slide-up"
             [ngClass]="{
               'self-end items-end': isCurrentUser(msg),
               'self-start items-start': !isCurrentUser(msg)
             }">
          
          <div class="text-[10px] text-muted mb-1 mx-1 font-medium" *ngIf="!isCurrentUser(msg)">{{ msg.username }} <span *ngIf="msg.senderRole === 'agent'" class="ml-1 px-1.5 py-0.5 bg-primary/10 text-primary rounded-full text-[8px] uppercase tracking-wider">FastEMIs</span></div>
          
          <div class="p-3 rounded-2xl shadow-sm text-sm"
               [ngClass]="{
                 'bg-primary text-white rounded-tr-sm': isCurrentUser(msg),
                 'bg-surface border border-border text-primary rounded-tl-sm': !isCurrentUser(msg)
               }">
            <!-- Handle Text -->
            <span *ngIf="msg.type === 'text'">{{ msg.content }}</span>
            <!-- Handle Media -->
            <div *ngIf="msg.type === 'media'" class="flex flex-col gap-2">
               <img *ngIf="msg.mediaUrl" [src]="msg.mediaUrl" class="rounded max-h-48 object-cover">
               <span class="text-xs font-mono bg-black/10 px-2 py-1 rounded w-max">{{ msg.mediaName }}</span>
            </div>
          </div>
          <div class="text-[10px] text-muted mt-1 flex items-center gap-1 mx-1">
            {{ msg.timestamp | communityTimeAgo }}
          </div>
          
        </div>

      </main>

      <!-- Input Area -->
      <footer class="bg-surface border-t border-border p-3 flex flex-col gap-2 shrink-0">
        <!-- Media Upload Preview (Simulated) -->
        <div *ngIf="pendingMedia" class="flex items-center gap-3 bg-surface-2 p-2 rounded-lg border border-border slide-up">
           <div class="w-10 h-10 bg-surface-3 rounded flex items-center justify-center text-primary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
           </div>
           <div class="flex-1 overflow-hidden">
             <p class="text-xs font-medium truncate text-primary">{{ pendingMedia.name }}</p>
             <p class="text-[10px] text-secondary">Ready to send</p>
           </div>
           <button (click)="pendingMedia = null" class="w-8 h-8 flex items-center justify-center text-error hover:bg-error/10 rounded-full transition-colors"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>

        <div class="flex items-center gap-2">
          <!-- Hidden File Input -->
          <input type="file" #fileInput class="hidden" (change)="onFileSelected($event)" accept="image/*,video/*">
          
          <button (click)="fileInput.click()" class="w-10 h-10 rounded-full text-secondary hover:bg-surface-3 flex items-center justify-center transition-standard shrink-0" title="Attach Media">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
          </button>
          
          <div class="flex-1 bg-surface-2 rounded-full border border-border px-4 py-2 flex items-center">
            <input 
              type="text" 
              [(ngModel)]="newMessage" 
              (keyup.enter)="sendMessage()"
              placeholder="Message the community..." 
              class="w-full bg-transparent border-none outline-none text-sm text-primary placeholder-muted" />
          </div>
          
          <button 
            class="w-10 h-10 rounded-full flex items-center justify-center transition-standard shrink-0"
            [ngClass]="(newMessage.trim() || pendingMedia) ? 'bg-primary text-white shadow-md' : 'bg-surface-3 text-muted'"
            [disabled]="!newMessage.trim() && !pendingMedia"
            (click)="sendMessage()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
      </footer>
    </div>
  `
})
export class CommunityComponent implements OnInit, AfterViewChecked {
    @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

    newMessage: string = '';
    pendingMedia: { name: string, url: string } | null = null;
    currentUserName: string = 'Anonymous User';

    constructor(
        public communityService: CommunityService,
        private authService: AuthService
    ) { }

    ngOnInit() {
        const user = this.authService.currentUserSignal();
        if (user && user.fullName) {
            this.currentUserName = user.fullName;
        }
        this.scrollToBottom();
    }

    ngAfterViewChecked() {
        this.scrollToBottom();
    }

    isCurrentUser(msg: CommunityMessage): boolean {
        return msg.senderRole === 'user' && msg.username === this.currentUserName;
    }

    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            // Create a fake local URL for the simulated upload preview
            const objectUrl = URL.createObjectURL(file);
            this.pendingMedia = {
                name: file.name,
                url: objectUrl
            };
        }
        event.target.value = ''; // Reset input
    }

    sendMessage() {
        if (!this.newMessage.trim() && !this.pendingMedia) return;

        // Determine type
        const isMedia = !!this.pendingMedia;

        this.communityService.sendMessage({
            senderRole: 'user',
            username: this.currentUserName,
            content: this.newMessage.trim(),
            type: isMedia ? 'media' : 'text',
            mediaUrl: this.pendingMedia?.url,
            mediaName: this.pendingMedia?.name
        });

        this.newMessage = '';
        this.pendingMedia = null;
    }

    scrollToBottom(): void {
        try {
            this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
        } catch (err) { }
    }
}
