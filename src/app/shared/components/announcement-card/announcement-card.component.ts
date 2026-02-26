import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Announcement } from '../../../core/services/announcement.service';

@Component({
    selector: 'app-announcement-card',
    standalone: true,
    imports: [CommonModule],
    template: `
    <article
      class="relative w-full rounded-2xl overflow-hidden shadow-md border mb-4 transition-all duration-300 transform"
      [class.hover:shadow-lg]="true"
      [class.bg-accent-50]="announcement.type === 'GLOBAL'"
      [class.border-accent-200]="announcement.type === 'GLOBAL'"
      [class.bg-blue-50]="announcement.type === 'PRIVATE'"
      [class.border-blue-200]="announcement.type === 'PRIVATE'"
    >
      <!-- Pulsing Indicator Line -->
      <div 
        class="absolute left-0 top-0 bottom-0 w-1.5"
        [class.bg-accent]="announcement.type === 'GLOBAL'"
        [class.bg-blue-600]="announcement.type === 'PRIVATE'"
      ></div>

      <div class="px-5 py-5 sm:px-6 relative flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        
        <!-- Target User Badge for Agent View (Only visible if showTarget is true) -->
        <div *ngIf="showTarget && announcement.type === 'PRIVATE'" class="absolute top-2 right-2 flex items-center gap-1 bg-white/60 border border-blue-100 px-2 py-0.5 rounded-full text-[10px] font-bold text-blue-800 uppercase tracking-widest">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            User: {{ announcement.targetUserName || announcement.targetUserId }}
        </div>

        <div class="flex-1 flex flex-col gap-1.5 min-w-0 pr-4">
          <header class="flex items-center gap-2">
            <!-- Pulsing Dot -->
            <span class="relative flex h-2.5 w-2.5">
              <span 
                class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                [class.bg-accent]="announcement.type === 'GLOBAL'"
                [class.bg-blue-500]="announcement.type === 'PRIVATE'">
              </span>
              <span 
                class="relative inline-flex rounded-full h-2.5 w-2.5"
                [class.bg-accent]="announcement.type === 'GLOBAL'"
                [class.bg-blue-600]="announcement.type === 'PRIVATE'">
              </span>
            </span>

            <h3 class="text-base font-bold text-primary leading-tight truncate">
              {{ announcement.title }}
            </h3>
            
            <span 
              class="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ml-1"
              [class.bg-accent-100]="announcement.type === 'GLOBAL'"
              [class.text-accent-800]="announcement.type === 'GLOBAL'"
              [class.bg-blue-100]="announcement.type === 'PRIVATE'"
              [class.text-blue-800]="announcement.type === 'PRIVATE'"
            >
              {{ announcement.priorityLabel || (announcement.type === 'PRIVATE' ? 'Action Required' : 'Announcement') }}
            </span>
          </header>
          
          <p class="text-sm text-secondary font-medium pl-4.5 leading-relaxed">
            {{ announcement.description }}
          </p>
        </div>

        <!-- Call To Action -->
        <div class="mt-2 sm:mt-0 flex-shrink-0 flex items-center justify-end sm:pl-4">
          <button 
             (click)="onAction.emit(announcement)"
             class="whitespace-nowrap inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 w-full sm:w-auto"
             [class.bg-accent]="announcement.type === 'GLOBAL'"
             [class.hover:bg-accent-600]="announcement.type === 'GLOBAL'"
             [class.focus:ring-accent]="announcement.type === 'GLOBAL'"
             [class.bg-blue-600]="announcement.type === 'PRIVATE'"
             [class.hover:bg-blue-700]="announcement.type === 'PRIVATE'"
             [class.focus:ring-blue-600]="announcement.type === 'PRIVATE'">
            {{ announcement.ctaText }}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </article>
  `,
    styles: [`
    :host {
      display: block;
      width: 100%;
    }
    
    /* Fallback extensions if standard Tailwind colors aren't fully configured in the project */
    .bg-accent-50 { background-color: rgba(var(--color-accent-rgb, 14, 165, 233), 0.05); }
    .bg-accent-100 { background-color: rgba(var(--color-accent-rgb, 14, 165, 233), 0.1); }
    .text-accent-800 { color: rgba(var(--color-accent-rgb, 14, 165, 233), 0.8); }
    .border-accent-200 { border-color: rgba(var(--color-accent-rgb, 14, 165, 233), 0.2); }
  `]
})
export class AnnouncementCardComponent {
    @Input({ required: true }) announcement!: Announcement;

    /** Used by the Agent View to visually see who the Private announcement belongs to */
    @Input() showTarget = false;

    @Output() onAction = new EventEmitter<Announcement>();
}
