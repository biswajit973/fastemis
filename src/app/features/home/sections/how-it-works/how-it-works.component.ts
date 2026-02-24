import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-home-how-it-works',
    standalone: true,
    imports: [CommonModule],
    template: `
    <section class="py-16 md:py-24 bg-surface">
      <div class="container">
        <h2 class="text-3xl md:text-4xl text-center text-primary mb-12">Four Steps to Your Finance</h2>
        
        <div class="flex overflow-x-auto md:grid md:grid-cols-4 gap-6 pb-6 hide-scrollbar snap-x snap-mandatory">
          
          <div class="min-w-[280px] md:min-w-0 snap-center bg-surface-2 p-6 rounded-2xl relative overflow-hidden">
            <div class="text-6xl font-display font-bold text-white opacity-50 absolute -top-4 -right-2 pointer-events-none">1</div>
            <div class="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center mb-6">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <h3 class="text-xl font-bold text-primary mb-3">Choose a Partner</h3>
            <p class="text-secondary text-sm">Browse our verified NBFC partners. Compare rates, tenure, and reviews from real customers.</p>
          </div>

          <div class="min-w-[280px] md:min-w-0 snap-center bg-surface-2 p-6 rounded-2xl relative overflow-hidden">
            <div class="text-6xl font-display font-bold text-white opacity-50 absolute -top-4 -right-2 pointer-events-none">2</div>
            <div class="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center mb-6">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
            <h3 class="text-xl font-bold text-primary mb-3">Apply Online</h3>
            <p class="text-secondary text-sm">Submit your KYC documents securely. No branch visit. Your data is encrypted end-to-end.</p>
          </div>

          <div class="min-w-[280px] md:min-w-0 snap-center bg-surface-2 p-6 rounded-2xl relative overflow-hidden">
            <div class="text-6xl font-display font-bold text-white opacity-50 absolute -top-4 -right-2 pointer-events-none">3</div>
            <div class="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center mb-6">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <h3 class="text-xl font-bold text-primary mb-3">Quick Verification</h3>
            <p class="text-secondary text-sm">Our team verifies your documents manually — every application reviewed by a real person, not an algorithm.</p>
          </div>

          <div class="min-w-[280px] md:min-w-0 snap-center bg-accent-soft p-6 rounded-2xl relative overflow-hidden">
            <div class="text-6xl font-display font-bold text-white opacity-50 absolute -top-4 -right-2 pointer-events-none">4</div>
            <div class="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center mb-6 shadow-md">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            </div>
            <h3 class="text-xl font-bold text-primary mb-3">Coins Disbursed</h3>
            <p class="text-secondary text-sm">Once approved, your finance amount is processed and your purchase is ready.</p>
          </div>

        </div>
      </div>
    </section>
  `
})
export class HomeHowItWorksComponent { }
