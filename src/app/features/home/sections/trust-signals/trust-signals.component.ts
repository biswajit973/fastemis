import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-home-trust',
    standalone: true,
    imports: [CommonModule],
    template: `
    <section class="py-16 md:py-24 bg-surface">
      <div class="container">
        
        <h2 class="text-3xl md:text-4xl text-center text-primary mb-12">Why FastEMIs?</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div class="flex flex-col items-center">
            <div class="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center text-primary mb-6 shadow-sm border border-border">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
            <h3 class="font-bold text-xl text-primary mb-3">Bank-Grade Security</h3>
            <p class="text-secondary text-sm">256-bit SSL encryption. Your documents never stored unencrypted.</p>
          </div>
          
          <div class="flex flex-col items-center">
            <div class="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center text-primary mb-6 shadow-sm border border-border">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </div>
            <h3 class="font-bold text-xl text-primary mb-3">Human Verification</h3>
            <p class="text-secondary text-sm">Every application reviewed by our trained verification team, not an algorithm.</p>
          </div>
          
          <div class="flex flex-col items-center">
            <div class="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center text-primary mb-6 shadow-sm border border-border">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            </div>
            <h3 class="font-bold text-xl text-primary mb-3">Fast Processing</h3>
            <p class="text-secondary text-sm">Most applications processed within 72 hours of document submission.</p>
          </div>
        </div>

      </div>
    </section>
  `
})
export class HomeTrustComponent { }
