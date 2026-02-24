import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-home-hero',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  styles: [`
    .hero-shuffle-stage {
      perspective: 1500px;
      perspective-origin: 68% 40%;
    }

    .hero-deck-shell {
      position: relative;
      width: min(100%, 23rem);
      height: 24.5rem;
      margin-left: auto;
    }

    .hero-deck-glow {
      position: absolute;
      inset: auto 10% 3% 10%;
      height: 28%;
      border-radius: 999px;
      background: radial-gradient(circle, rgba(12, 65, 43, 0.2) 0%, rgba(12, 65, 43, 0.04) 55%, transparent 76%);
      filter: blur(8px);
      pointer-events: none;
    }

    .hero-shuffle-card {
      position: absolute;
      inset: 0;
      transform-origin: 50% 88%;
      will-change: transform, opacity, z-index;
      backface-visibility: hidden;
      border-radius: 1.25rem;
      border: 1px solid #d1d9e6;
      background: linear-gradient(135deg, #ffffff 0%, #f0f4f8 50%, #e2e8ec 100%);
      box-shadow: 
        0 25px 50px -12px rgba(20, 27, 35, 0.25), 
        0 8px 24px -4px rgba(20, 27, 35, 0.15),
        inset 0 3px 6px rgba(255, 255, 255, 1), 
        inset 0 -3px 6px rgba(0, 0, 0, 0.04);
      padding: 1rem 1rem 0.9rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      animation: heroDeckShuffle 8s linear infinite;
    }

    .hero-shuffle-a { animation-delay: 0s; }
    .hero-shuffle-b { animation-delay: -6s; }
    .hero-shuffle-c { animation-delay: -4s; }
    .hero-shuffle-d { animation-delay: -2s; }

    .hero-shuffle-stage:hover .hero-shuffle-card {
      animation-play-state: paused;
    }

    @keyframes heroDeckShuffle {
      0%, 12% {
        transform: translate3d(0, 0px, 0) rotate(-1.8deg) scale(1);
        z-index: 4;
        animation-timing-function: ease-out;
      }
      17% {
        transform: translate3d(140px, -35px, 0) rotate(15deg) scale(1.05);
        z-index: 5;
        animation-timing-function: ease-in;
      }
      18% {
        transform: translate3d(120px, -20px, 0) rotate(12deg) scale(1.03);
        z-index: 1;
        animation-timing-function: ease-out;
      }
      25%, 37% {
        transform: translate3d(0, 36px, 0) rotate(1.3deg) scale(0.91);
        z-index: 1;
        animation-timing-function: ease-in-out;
      }
      50%, 62% {
        transform: translate3d(0, 24px, 0) rotate(0.6deg) scale(0.94);
        z-index: 2;
        animation-timing-function: ease-in-out;
      }
      75%, 87% {
        transform: translate3d(0, 12px, 0) rotate(-0.7deg) scale(0.97);
        z-index: 3;
        animation-timing-function: ease-in-out;
      }
      100% {
        transform: translate3d(0, 0px, 0) rotate(-1.8deg) scale(1);
        z-index: 4;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .hero-shuffle-a,
      .hero-shuffle-b,
      .hero-shuffle-c,
      .hero-shuffle-d {
        animation: none !important;
      }
    }
  `],
  template: `
    <section class="pt-24 pb-12 md:pt-32 md:pb-20 relative overflow-hidden">
      <!-- Background SVG abstraction -->
      <div class="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E8F5E9" stroke-width="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <!-- Abstract chart lines -->
          <path d="M0 80 Q 200 150 400 50 T 800 100 T 1200 40" fill="none" stroke="#DDE3EC" stroke-width="2" />
          <path d="M0 120 Q 250 180 450 80 T 900 130 T 1200 60" fill="none" stroke="#f6f8fb" stroke-width="4" />
        </svg>
      </div>

      <div class="container relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-16">
        
        <!-- Left Content -->
        <div class="flex-1 flex flex-col items-center text-center md:items-start md:text-left fade-in">
          <h1 class="font-display text-4xl md:text-5xl lg:text-6xl text-primary leading-tight mb-4 tracking-tight">
            Finance Your Goals.<br/>
            No Branch Visits.<br/>
            <span class="text-accent relative inline-block">
              No Waiting Lines.
              <!-- Underline swoosh -->
              <svg class="absolute w-full h-3 -bottom-1 left-0 text-accent opacity-30" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 2" stroke="currentColor" stroke-width="4" fill="none" />
              </svg>
            </span>
          </h1>
          
          <p class="text-secondary text-base md:text-lg max-w-lg mb-8">
            Compare the world's trusted EMI partners, apply in minutes, and get your purchase financed &mdash; entirely online.
          </p>

          <!-- Trust Badges Row -->
          <div class="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-8">
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-3 border border-border rounded-full text-xs font-medium text-primary shadow-sm">
              <span>🔒</span> Globally Regulated
            </span>
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-3 border border-border rounded-full text-xs font-medium text-primary shadow-sm">
              <span>⚡</span> Instant Processing
            </span>
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-3 border border-border rounded-full text-xs font-medium text-primary shadow-sm hidden sm:flex">
              <span>🛡️</span> 256-bit Secure
            </span>
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-3 border border-border rounded-full text-xs font-medium text-primary shadow-sm hidden lg:flex">
              <span>✅</span> Licensed Institution
            </span>
          </div>

          <app-button variant="primary" [fullWidth]="false" class="w-full md:w-auto shadow-md" (onClick)="scrollToPartners()">
            Explore Finance Partners &rarr;
          </app-button>
        </div>

        <!-- Right Visual (Realistic Shuffle Deck) -->
        <div class="hero-shuffle-stage flex-1 relative w-full h-64 md:h-[26rem] scale-in hidden md:block">
          <div class="hero-deck-shell">
            <div class="hero-deck-glow"></div>

            <article class="hero-shuffle-card hero-shuffle-a">
              <div class="flex items-start justify-between">
                <div>
                  <p class="text-[11px] uppercase tracking-wide text-muted">CoinVault Finance</p>
                  <p class="text-base font-semibold text-primary mt-1">EMI approved for iPhone 17 Pro</p>
                </div>
                <span class="text-[10px] font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700">Approved</span>
              </div>
              <div class="space-y-1.5 mt-4 text-[12px] text-secondary">
                <p><span class="font-medium text-primary">Amount:</span> ₹1,49,900</p>
                <p><span class="font-medium text-primary">Plan:</span> Split into 12 easy parts</p>
              </div>
              <div class="mt-3 h-2 rounded-full bg-surface-3 overflow-hidden">
                <div class="h-full w-4/5 bg-accent rounded-full"></div>
              </div>
              <p class="text-[11px] text-secondary mt-2">Checkout ready in your account</p>
            </article>

            <article class="hero-shuffle-card hero-shuffle-b">
              <div class="flex items-start justify-between">
                <div>
                  <p class="text-[11px] uppercase tracking-wide text-muted">CoinVault Finance</p>
                  <p class="text-base font-semibold text-primary mt-1">Buy now, pay later approved for Sony PlayStation 5</p>
                </div>
                <span class="text-[10px] font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700">Approved</span>
              </div>
              <div class="space-y-1.5 mt-4 text-[12px] text-secondary">
                <p><span class="font-medium text-primary">Amount:</span> ₹54,990</p>
                <p><span class="font-medium text-primary">Plan:</span> Split into 10 easy parts</p>
              </div>
              <div class="mt-3 h-2 rounded-full bg-surface-3 overflow-hidden">
                <div class="h-full w-3/4 bg-accent rounded-full"></div>
              </div>
              <p class="text-[11px] text-secondary mt-2">Payment schedule synced instantly</p>
            </article>

            <article class="hero-shuffle-card hero-shuffle-c">
              <div class="flex items-start justify-between">
                <div>
                  <p class="text-[11px] uppercase tracking-wide text-muted">CoinVault Finance</p>
                  <p class="text-base font-semibold text-primary mt-1">EMI approved for iPhone 16 Pro Max</p>
                </div>
                <span class="text-[10px] font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700">Approved</span>
              </div>
              <div class="space-y-1.5 mt-4 text-[12px] text-secondary">
                <p><span class="font-medium text-primary">Amount:</span> ₹1,39,900</p>
                <p><span class="font-medium text-primary">Plan:</span> Split into 24 easy parts</p>
              </div>
              <div class="mt-3 h-2 rounded-full bg-surface-3 overflow-hidden">
                <div class="h-full w-[70%] bg-accent rounded-full"></div>
              </div>
              <p class="text-[11px] text-secondary mt-2">Auto-adjusted in your EMI timeline</p>
            </article>

            <article class="hero-shuffle-card hero-shuffle-d">
              <div class="flex items-start justify-between">
                <div>
                  <p class="text-[11px] uppercase tracking-wide text-muted">CoinVault Finance</p>
                  <p class="text-base font-semibold text-primary mt-1">EMI approved for Lenovo Legion Laptop</p>
                </div>
                <span class="text-[10px] font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700">Approved</span>
              </div>
              <div class="space-y-1.5 mt-4 text-[12px] text-secondary">
                <p><span class="font-medium text-primary">Amount:</span> ₹1,24,990</p>
                <p><span class="font-medium text-primary">Plan:</span> Split into 18 easy parts</p>
              </div>
              <div class="mt-3 h-2 rounded-full bg-surface-3 overflow-hidden">
                <div class="h-full w-[68%] bg-accent rounded-full"></div>
              </div>
              <p class="text-[11px] text-secondary mt-2">Offer queued with your profile rules</p>
            </article>
          </div>
        </div>
      </div>
    </section>
  `
})
export class HomeHeroComponent {
  scrollToPartners() {
    const el = document.getElementById('partnersList');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
