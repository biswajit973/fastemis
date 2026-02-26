import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="fixed top-0 left-0 right-0 z-50 border-b border-border/70 bg-surface/95 backdrop-blur-md">
      <div class="mx-auto w-full max-w-6xl px-3 sm:px-4">
        <div class="h-14 flex items-center justify-between">
          <a routerLink="/" class="inline-flex items-center gap-2 no-underline text-primary font-semibold">
            <span class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">F</span>
            <span class="text-base">FastEMIs</span>
          </a>

          <nav class="hidden md:flex items-center gap-1">
            <a routerLink="/" routerLinkActive="bg-surface-2 text-primary" [routerLinkActiveOptions]="{ exact: true }"
              class="px-3 py-2 rounded-lg text-sm text-secondary hover:text-primary hover:bg-surface-2 no-underline">Home</a>
            <a routerLink="/partner/coinvault-finance" routerLinkActive="bg-surface-2 text-primary"
              class="px-3 py-2 rounded-lg text-sm text-secondary hover:text-primary hover:bg-surface-2 no-underline">Vendors</a>
            <a routerLink="/testimonials-all" routerLinkActive="bg-surface-2 text-primary"
              class="px-3 py-2 rounded-lg text-sm text-secondary hover:text-primary hover:bg-surface-2 no-underline">Testimonials</a>
            <a routerLink="/sign-up" routerLinkActive="bg-surface-2 text-primary"
              class="px-3 py-2 rounded-lg text-sm text-secondary hover:text-primary hover:bg-surface-2 no-underline">Register</a>
          </nav>

          <div class="hidden md:flex items-center gap-2">
            <div class="relative">
              <button type="button" (click)="toggleDesktopSignMenu()"
                class="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-primary hover:bg-surface-2">
                Log In
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              <div *ngIf="desktopSignMenuOpen" class="absolute right-0 mt-2 w-52 rounded-xl border border-border bg-surface shadow-lg overflow-hidden">
                <a routerLink="/sign-in" (click)="closeMenus()"
                  class="block px-3 py-2.5 text-sm text-primary no-underline hover:bg-surface-2">User Login</a>
                <a routerLink="/agent-sign-in" (click)="closeMenus()"
                  class="block px-3 py-2.5 text-sm text-primary no-underline hover:bg-surface-2 border-t border-border">Vendor (Agent) Login</a>
              </div>
            </div>
          </div>

          <button type="button" class="md:hidden h-10 w-10 rounded-lg border border-border bg-surface-2 flex items-center justify-center"
            (click)="toggleMobileMenu()"
            aria-label="Toggle menu">
            <svg *ngIf="!mobileMenuOpen" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
            <svg *ngIf="mobileMenuOpen" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    </header>

    <div *ngIf="mobileMenuOpen" class="md:hidden fixed inset-0 z-40 bg-black/30" (click)="closeMenus()"></div>
    <aside *ngIf="mobileMenuOpen" class="md:hidden fixed top-14 left-0 right-0 z-50 border-b border-border bg-surface shadow-xl">
      <nav class="px-3 py-2 space-y-1">
        <a routerLink="/" (click)="closeMenus()" class="block rounded-lg px-3 py-2.5 text-sm text-primary no-underline hover:bg-surface-2">Home</a>
        <a routerLink="/partner/coinvault-finance" (click)="closeMenus()" class="block rounded-lg px-3 py-2.5 text-sm text-primary no-underline hover:bg-surface-2">Vendors</a>
        <a routerLink="/testimonials-all" (click)="closeMenus()" class="block rounded-lg px-3 py-2.5 text-sm text-primary no-underline hover:bg-surface-2">Testimonials</a>
        <a routerLink="/sign-up" (click)="closeMenus()" class="block rounded-lg px-3 py-2.5 text-sm text-primary no-underline hover:bg-surface-2">Register</a>

        <a routerLink="/sign-in" (click)="closeMenus()" class="block rounded-lg px-3 py-2.5 text-sm text-primary no-underline hover:bg-surface-2 border-t border-border mt-1 pt-3">User Login</a>
        <a routerLink="/agent-sign-in" (click)="closeMenus()" class="block rounded-lg px-3 py-2.5 text-sm text-primary no-underline hover:bg-surface-2">Vendor (Agent) Login</a>
      </nav>
    </aside>

    <div *ngIf="desktopSignMenuOpen" class="hidden md:block fixed inset-0 z-40" (click)="closeMenus()"></div>
  `
})
export class NavbarComponent {
  mobileMenuOpen = false;
  desktopSignMenuOpen = false;

  constructor() { }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    this.desktopSignMenuOpen = false;
  }

  toggleDesktopSignMenu(): void {
    this.desktopSignMenuOpen = !this.desktopSignMenuOpen;
  }

  closeMenus(): void {
    this.mobileMenuOpen = false;
    this.desktopSignMenuOpen = false;
  }
}
