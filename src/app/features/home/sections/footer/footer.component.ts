import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <footer class="bg-surface-2 pt-16 pb-8 border-t border-border">
      <div class="container">
        <div class="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
          
          <div class="max-w-sm">
            <div class="flex items-center gap-2 text-primary mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
              <span class="font-bold text-lg tracking-tight">FastEMIs</span>
            </div>
            <p class="text-sm text-secondary mb-4">
              FastEMIs is an EMI marketplace that connects buyers with RBI-registered finance partners for buy now, pay later plans.
            </p>
          </div>

          <div class="flex gap-12 flex-wrap">
            <div>
              <h4 class="font-bold text-primary mb-4">Platform</h4>
              <ul class="space-y-2 text-sm text-secondary">
                <li><a href="#" class="hover:text-primary transition-standard no-underline">Browse Partners</a></li>
                <li><a href="#" class="hover:text-primary transition-standard no-underline">How it Works</a></li>
                <li><a href="#" class="hover:text-primary transition-standard no-underline">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 class="font-bold text-primary mb-4">Legal</h4>
              <ul class="space-y-2 text-sm text-secondary">
                <li><a href="#" class="hover:text-primary transition-standard no-underline">Privacy Policy</a></li>
                <li><a href="#" class="hover:text-primary transition-standard no-underline">Terms of Service</a></li>
                <li><a href="#" class="hover:text-primary transition-standard no-underline">Grievance Redressal</a></li>
              </ul>
            </div>
            <div>
              <h4 class="font-bold text-primary mb-4">Developers</h4>
              <ul class="space-y-2 text-sm text-secondary">
                <li><a routerLink="/tester" class="hover:text-primary transition-standard no-underline inline-flex items-center gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" class="text-accent" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>All Pages Tester</a></li>
                <li><a routerLink="/feature-details" class="hover:text-primary transition-standard no-underline">All Feature Details</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div class="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p class="text-xs text-muted">&copy; {{ year }} FastEMIs. All rights reserved.</p>
          <div class="flex gap-4 text-muted">
            <a href="#" class="hover:text-primary transition-standard">
              <span class="sr-only">Twitter</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
            </a>
            <a href="#" class="hover:text-primary transition-standard">
              <span class="sr-only">LinkedIn</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  `
})
export class HomeFooterComponent {
  year = new Date().getFullYear();
}
