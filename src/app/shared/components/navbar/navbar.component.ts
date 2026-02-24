import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <nav 
      class="fixed top-0 left-0 right-0 z-50 transition-standard bg-surface"
      [ngClass]="{'shadow-sm': isScrolled}"
      style="height: 56px; @media (min-width: 1024px) { height: 64px; }">
      <div class="container h-full flex items-center justify-between">
        
        <!-- Logo -->
        <a routerLink="/" class="flex items-center gap-2 text-primary no-underline">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          <span class="font-bold text-lg tracking-tight">FastEMIs</span>
        </a>

        <!-- Links & Auth -->
        <div class="flex items-center gap-2 md:gap-3">
          <a routerLink="/tester" class="hidden md:inline-flex text-sm font-medium text-secondary hover:text-primary transition-standard px-3 py-2 rounded-lg hover:bg-surface-2 no-underline">
            Tester
          </a>

          @if (!auth.isAuthenticated()) {
            <a routerLink="/sign-in" class="inline-flex items-center gap-1 text-sm font-medium text-primary transition-standard px-3 py-2 rounded-lg border border-border hover:bg-surface-2 no-underline">
              Real Login
            </a>
          } @else {
            <a
              [routerLink]="auth.currentUserSignal()?.role === 'vendor' ? '/agent' : '/dashboard'"
              class="inline-flex items-center gap-1 text-sm font-medium text-primary transition-standard px-3 py-2 rounded-lg border border-border hover:bg-surface-2 no-underline">
              Dashboard
            </a>
          }

          <a routerLink="/sign-in" class="md:hidden flex items-center justify-center bg-surface-3 text-primary rounded-full w-8 h-8 no-underline">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          </a>
        </div>
      </div>
    </nav>
  `
})
export class NavbarComponent {
  isScrolled = false;

  constructor(public auth: AuthService) { }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 20;
  }
}
