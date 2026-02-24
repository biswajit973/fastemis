import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

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
      <div>
        <button (click)="logout()" class="text-sm font-medium text-secondary hover:text-primary transition-standard">
          Sign Out
        </button>
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
        <div class="absolute top-2 right-8 w-2 h-2 bg-error rounded-full block"></div>
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
            Messages
          </div>
          <span class="bg-error text-white text-[10px] font-bold px-2 py-0.5 rounded-full">New</span>
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
  private authService = inject(AuthService);

  logout() {
    this.authService.logout();
  }
}
