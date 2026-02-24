import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ChatService } from '../../../../core/services/chat.service';

@Component({
  selector: 'app-dashboard-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <!-- Top Nav -->
    <nav class="bg-surface border-b border-border h-14 md:h-16 flex items-center justify-between px-4 fixed top-0 left-0 right-0 z-40 bg-opacity-95 backdrop-blur-md">
      <div class="flex items-center gap-2">
        <a routerLink="/" class="flex items-center gap-2 font-bold text-primary tracking-tight">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
          FastEMIs
        </a>
      </div>
      <div class="relative">
        <button
          (click)="toggleProfileMenu()"
          class="flex items-center gap-3 p-1 rounded-xl hover:bg-surface-2 transition-colors">
          <div class="hidden sm:block text-right">
            <div class="text-sm font-bold leading-tight" [ngClass]="isAgent() ? 'text-accent' : 'text-primary'">
              {{ isAgent() ? 'Agent' : 'User' }}: {{ authService.currentUserSignal()?.fullName || 'Acme Corp' }}
            </div>
            <div class="text-xs text-muted">{{ isAgent() ? 'Vendor ID:' : 'User ID:' }} {{ authService.currentUserSignal()?.id || 'MOCK-123' }}</div>
          </div>
          <div class="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold font-display shadow-sm border"
               [ngClass]="isAgent() ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-primary-light/20 text-primary border-primary/20'">
            {{ getInitials() }}
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-secondary hidden sm:block">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>

        <div
          *ngIf="profileMenuOpen"
          class="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          <div class="block sm:hidden px-4 py-3 border-b border-border bg-surface-2">
            <div class="text-sm font-bold text-primary">{{ authService.currentUserSignal()?.fullName || 'User' }}</div>
            <div class="text-xs text-secondary mt-0.5">{{ authService.currentUserSignal()?.id }}</div>
          </div>
          <a routerLink="/dashboard/profile" (click)="closeMenu()" class="block px-4 py-3 text-sm text-primary hover:bg-surface-2 no-underline transition-colors">
            Profile Settings
          </a>
          <button
            (click)="logout()"
            class="w-full text-left px-4 py-3 text-sm text-error hover:bg-error/5 transition-colors border-t border-border font-medium">
            Sign Out
          </button>
        </div>
      </div>
    </nav>

    <!-- Bottom Nav (Mobile) -->
    <div class="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface border-t border-border z-40 flex justify-around items-center pb-[env(safe-area-inset-bottom)]">
      <a routerLink="/dashboard" routerLinkActive="text-primary bg-primary-light/10" [routerLinkActiveOptions]="{exact: true}" 
         class="flex flex-col items-center justify-center w-full h-full text-secondary hover:text-primary transition-standard">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mb-1"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
        <span class="text-[10px] font-medium">Home</span>
      </a>
      <a routerLink="/dashboard/messages" routerLinkActive="text-primary bg-primary-light/10" 
         class="flex flex-col items-center justify-center w-full h-full text-secondary hover:text-primary transition-standard relative">
        <div *ngIf="unreadCount() > 0" class="absolute top-2 right-[25%] md:right-8 w-2 h-2 bg-error rounded-full block animate-pulse"></div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mb-1"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
        <span class="text-[10px] font-medium">Messages</span>
      </a>
      <a routerLink="/dashboard/profile" routerLinkActive="text-primary bg-primary-light/10" 
         class="flex flex-col items-center justify-center w-full h-full text-secondary hover:text-primary transition-standard">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mb-1"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        <span class="text-[10px] font-medium">Profile</span>
      </a>
      <a routerLink="/dashboard/community" routerLinkActive="text-primary bg-primary-light/10" 
         class="flex flex-col items-center justify-center w-full h-full text-secondary hover:text-primary transition-standard">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mb-1"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
        <span class="text-[10px] font-medium">Community</span>
      </a>
      <a routerLink="/dashboard/send-payments" routerLinkActive="text-primary bg-primary-light/10"
         class="flex flex-col items-center justify-center w-full h-full text-secondary hover:text-primary transition-standard">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mb-1"><path d="M12 1v22"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
        <span class="text-[10px] font-medium">Send</span>
      </a>
    </div>

    <!-- Side Nav (Desktop) -->
    <aside class="hidden md:block fixed left-0 top-16 bottom-0 w-64 bg-surface border-r border-border pt-8 px-4 z-30">
      <nav class="space-y-2">
        <a routerLink="/dashboard" routerLinkActive="bg-primary text-white" [routerLinkActiveOptions]="{exact: true}"
           class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-secondary hover:bg-surface-3 transition-standard">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          Dashboard Overview
        </a>
        <a routerLink="/dashboard/messages" routerLinkActive="bg-primary text-white"
           class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-secondary hover:bg-surface-3 transition-standard justify-between">
          <div class="flex items-center gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            <span class="relative">
              Messages
              <span *ngIf="unreadCount() > 0" class="absolute -top-1 -right-2 flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-error"></span>
              </span>
            </span>
          </div>
          <span *ngIf="unreadCount() > 0" class="bg-error text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">{{ unreadCount() }} New</span>
        </a>
        <a routerLink="/dashboard/profile" routerLinkActive="bg-primary text-white"
           class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-secondary hover:bg-surface-3 transition-standard">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          Profile Settings
        </a>
        <a routerLink="/dashboard/community" routerLinkActive="bg-primary text-white"
           class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-secondary hover:bg-surface-3 transition-standard">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          Community Forum
        </a>
        <a routerLink="/dashboard/send-payments" routerLinkActive="bg-primary text-white"
           class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-secondary hover:bg-surface-3 transition-standard">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1v22"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          Send Payments
        </a>
      </nav>
    </aside>
  `
})
export class DashboardNavComponent {
  public authService = inject(AuthService);
  private chatService = inject(ChatService);
  private router = inject(Router);

  profileMenuOpen = false;
  unreadCount = signal<number>(0);

  constructor() {
    effect(() => {
      const user = this.authService.currentUserSignal();
      if (user) {
        const signalRef = this.chatService.getUnreadSignal(user.id);
        this.unreadCount.set(signalRef());
      } else {
        this.unreadCount.set(0);
      }
    }, { allowSignalWrites: true });
  }

  isAgent(): boolean {
    return this.authService.currentUserSignal()?.role === 'vendor';
  }

  getInitials(): string {
    const name = this.authService.currentUserSignal()?.fullName || 'User';
    if (this.isAgent()) return 'AC'; // Acme Corp default, or custom
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  toggleProfileMenu() {
    this.profileMenuOpen = !this.profileMenuOpen;
  }

  closeMenu() {
    this.profileMenuOpen = false;
  }

  logout() {
    this.authService.logout();
    this.profileMenuOpen = false;
    this.router.navigate(['/']);
  }
}
