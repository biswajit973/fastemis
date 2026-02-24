import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-home-stats',
    standalone: true,
    imports: [CommonModule],
    template: `
    <section class="bg-surface-2 border-y border-border py-8">
      <div class="container">
        <!-- Scrollable on mobile -->
        <div class="flex overflow-x-auto hide-scrollbar snap-x snap-mandatory pb-4 md:pb-0 gap-6 md:gap-0 justify-between">
          <div class="snap-start flex flex-col items-center md:items-start min-w-[140px]">
            <span class="font-mono text-2xl md:text-3xl font-bold text-primary mb-1">₹500 Cr+</span>
            <span class="text-sm font-medium text-secondary">Disbursed</span>
          </div>

          <div class="hidden md:block w-px h-12 bg-border"></div>

          <div class="snap-start flex flex-col items-center md:items-start min-w-[140px]">
            <span class="font-mono text-2xl md:text-3xl font-bold text-primary mb-1">30+</span>
            <span class="text-sm font-medium text-secondary">Partners</span>
          </div>

          <div class="hidden md:block w-px h-12 bg-border"></div>

          <div class="snap-start flex flex-col items-center md:items-start min-w-[140px]">
            <span class="font-mono text-2xl md:text-3xl font-bold text-primary mb-1">4.8/5</span>
            <span class="text-sm font-medium text-secondary">Avg Rating</span>
          </div>

          <div class="hidden md:block w-px h-12 bg-border"></div>

          <div class="snap-start flex flex-col items-center md:items-start min-w-[140px]">
            <span class="font-mono text-2xl md:text-3xl font-bold text-primary mb-1">72 hrs</span>
            <span class="text-sm font-medium text-secondary">Max BGV Time</span>
          </div>
        </div>
      </div>
    </section>
  `
})
export class HomeStatsComponent { }
