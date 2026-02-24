import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-agent-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="bg-surface border-b border-border sticky top-0 z-40">
      <div class="px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          
          <div class="flex items-center gap-8">
            <a routerLink="/agent" class="flex items-center gap-2 text-primary no-underline">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-purple-600">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span class="font-bold text-lg tracking-tight">FastEMIs <span class="text-purple-600 font-medium">Partners</span></span>
            </a>

            <!-- Desktop Nav -->
            <nav class="hidden md:flex items-center gap-1 text-sm font-medium">
              <a routerLink="/agent" routerLinkActive="bg-surface-2 text-primary" [routerLinkActiveOptions]="{exact: true}" class="px-3 py-2 rounded-lg text-secondary hover:text-primary transition-standard no-underline">Dashboard</a>
              <a routerLink="/agent" routerLinkActive="bg-surface-2 text-primary" [routerLinkActiveOptions]="{exact: true}" class="px-3 py-2 rounded-lg text-secondary hover:text-primary transition-standard no-underline flex items-center gap-2">
                Queue
                <span class="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full">12</span>
              </a>
              <a routerLink="/agent/chats" routerLinkActive="bg-surface-2 text-primary" class="px-3 py-2 rounded-lg text-secondary hover:text-primary transition-standard no-underline">All Chats</a>
              <a routerLink="/agent/community" routerLinkActive="bg-surface-2 text-primary" class="px-3 py-2 rounded-lg text-secondary hover:text-primary transition-standard no-underline flex items-center gap-2">
                Community Space
              </a>
              <a routerLink="/agent/payments" routerLinkActive="bg-surface-2 text-primary" class="px-3 py-2 rounded-lg text-secondary hover:text-primary transition-standard no-underline">
                Payment Config
              </a>
            </nav>
          </div>

          <div class="relative">
            <button
              (click)="toggleProfileMenu()"
              class="flex items-center gap-3 p-1.5 rounded-xl hover:bg-surface-2 transition-colors">
              <div class="hidden sm:block text-right">
                <div class="text-sm font-bold text-primary leading-tight">{{ auth.currentUserSignal()?.fullName || 'Acme Corporation Agent' }}</div>
                <div class="text-xs text-muted">Vendor ID: {{ auth.currentUserSignal()?.id || 'VND-MOCK-999' }}</div>
              </div>
              <div class="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold font-display shadow-sm border border-purple-200">
                AC
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-secondary hidden sm:block">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            <div
              *ngIf="profileMenuOpen"
              class="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-xl shadow-lg z-50 overflow-hidden">
              <a routerLink="/" (click)="closeMenu()" class="block px-4 py-3 text-sm text-primary hover:bg-surface-2 no-underline transition-colors">
                Home Landing Page
              </a>
              <a routerLink="/tester" (click)="closeMenu()" class="block px-4 py-3 text-sm text-primary hover:bg-surface-2 no-underline transition-colors border-t border-border">
                Developer Pages
              </a>
              <a routerLink="/feature-details" (click)="closeMenu()" class="block px-4 py-3 text-sm text-primary hover:bg-surface-2 no-underline transition-colors border-t border-border">
                All Feature Details
              </a>
              <a routerLink="/dashboard" (click)="closeMenu()" class="block px-4 py-3 text-sm text-primary hover:bg-surface-2 no-underline transition-colors border-t border-border">
                User Dashboard
              </a>
              <button
                (click)="logout()"
                class="w-full text-left px-4 py-3 text-sm text-error hover:bg-error/5 transition-colors border-t border-border">
                Sign Out
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </header>
  `
})
export class AgentNavbarComponent {
  profileMenuOpen = false;

  constructor(
    public auth: AuthService,
    private router: Router
  ) { }

  toggleProfileMenu() {
    this.profileMenuOpen = !this.profileMenuOpen;
  }

  closeMenu() {
    this.profileMenuOpen = false;
  }

  logout() {
    this.auth.logout();
    this.profileMenuOpen = false;
    this.router.navigate(['/']);
  }
}
