import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface EmiVideo {
  rank: number;
  title: string;
  category: 'Mobile' | 'Laptop' | 'Gaming Console' | 'Television';
  videoId: string;
}

@Component({
  selector: 'app-top-emi-devices',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="py-16 md:py-20 relative overflow-hidden">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(10,37,64,0.08),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(16,122,90,0.08),transparent_50%)]"></div>
      <div class="container relative">
        <div class="mb-8 md:mb-10">
          <p class="inline-flex px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-primary/10 text-primary mb-3">
            Trending Picks
          </p>
          <h2 class="text-3xl md:text-4xl font-display font-bold text-primary mb-2">
            Top EMI Devices In Recent Months
          </h2>
          <p class="text-secondary max-w-3xl">
            Curated showcase from recent market trends and creator picks. Tap any card to preview video and compare device choices before you split your payment into easy EMI parts.
          </p>
        </div>

        <div class="flex gap-2 overflow-x-auto hide-scrollbar pb-2 mb-8">
          <span *ngFor="let chip of chips" class="px-3 py-1.5 text-xs rounded-full border border-border bg-surface text-secondary whitespace-nowrap">
            {{ chip }}
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
          <article
            *ngFor="let item of videos"
            class="group rounded-2xl border border-border bg-surface overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
            <button type="button" (click)="openVideo(item.videoId)" class="w-full text-left">
              <div class="relative">
                <img
                  [src]="'https://i.ytimg.com/vi/' + item.videoId + '/hqdefault.jpg'"
                  [alt]="item.title"
                  class="w-full aspect-video object-cover" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent"></div>
                <div class="absolute top-2 left-2 text-[11px] font-bold rounded-full bg-white/90 text-primary px-2 py-1">
                  #{{ item.rank }}
                </div>
                <div class="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-white/90 text-primary flex items-center justify-center shadow group-hover:scale-105 transition-transform">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg>
                </div>
              </div>
            </button>

            <div class="p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[11px] font-semibold uppercase tracking-wide text-accent">{{ item.category }}</span>
                <a
                  [href]="'https://www.youtube.com/watch?v=' + item.videoId"
                  target="_blank"
                  rel="noopener"
                  class="text-[11px] font-medium text-primary hover:underline no-underline">
                  Open
                </a>
              </div>
              <h3 class="text-sm font-semibold text-primary leading-snug min-h-[2.5rem]">{{ item.title }}</h3>
            </div>
          </article>
        </div>
      </div>
    </section>

    <div *ngIf="activeEmbedUrl()" class="fixed inset-0 z-[1200] bg-black/75 backdrop-blur-sm p-4 flex items-center justify-center">
      <div class="w-full max-w-4xl rounded-2xl border border-border bg-surface overflow-hidden">
        <div class="px-4 py-3 border-b border-border flex items-center justify-between">
          <div class="text-sm font-semibold text-primary">Video Preview</div>
          <button type="button" (click)="closeVideo()" class="text-secondary hover:text-primary transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="bg-black">
          <iframe
            class="w-full aspect-video"
            [src]="activeEmbedUrl()"
            title="Top EMI device video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen>
          </iframe>
        </div>
      </div>
    </div>
  `
})
export class TopEmiDevicesComponent {
  readonly chips = ['Top Mobiles', 'Best Laptops', 'Gaming Consoles', 'Smart TVs', 'Creator Picks'];

  readonly videos: EmiVideo[] = [
    { rank: 1, title: 'Best EMI Device Picks Right Now', category: 'Mobile', videoId: 'vcq5nMeg2SA' },
    { rank: 2, title: 'Top Value Devices For Easy EMI Buyers', category: 'Laptop', videoId: '6HaRMiTfvks' },
    { rank: 3, title: 'Most Popular EMI Gadget Shortlist', category: 'Mobile', videoId: 'MTtiyKc8f2g' },
    { rank: 4, title: 'Premium Device Options In EMI Range', category: 'Television', videoId: 'JMnyNzr9KFw' },
    { rank: 5, title: 'Smart Device Buying Guide For EMI Users', category: 'Laptop', videoId: 'fgfyEtqHhdI' },
    { rank: 6, title: 'Trending Electronics For Split Payments', category: 'Gaming Console', videoId: '5AKl_cEB26c' },
    { rank: 7, title: 'Creator Choice Devices For Monthly EMI', category: 'Mobile', videoId: 'ko8eNpR3iBY' },
    { rank: 8, title: 'Recent EMI Device Highlights', category: 'Television', videoId: 'bCqnOn23LWE' }
  ];

  activeEmbedUrl = signal<SafeResourceUrl | null>(null);

  constructor(private sanitizer: DomSanitizer) { }

  openVideo(videoId: string): void {
    const url = this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&rel=0`
    );
    this.activeEmbedUrl.set(url);
  }

  closeVideo(): void {
    this.activeEmbedUrl.set(null);
  }
}
