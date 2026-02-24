import { Component, Input, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Partner } from '../../../../core/models/partner.model';

@Component({
    selector: 'app-partner-navbar',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
    <nav class="fixed top-0 left-0 right-0 z-50 transition-standard"
         [ngClass]="isScrolled ? 'bg-surface shadow-sm' : 'bg-transparent'"
         style="height: 56px; @media (min-width: 1024px) { height: 64px; }">
      <div class="container h-full flex items-center justify-between">
        
        <!-- Partner Logo & Branding -->
        <a routerLink="/" class="flex items-center gap-2 no-underline">
          <div class="w-8 h-8 rounded-lg text-white flex items-center justify-center font-bold text-sm"
               [style.background-color]="partner?.color">
            {{ partner?.name?.charAt(0) }}
          </div>
          <span class="font-bold text-base md:text-lg tracking-tight" 
                [ngClass]="isScrolled ? 'text-primary' : 'text-white'">
            {{ partner?.name }}
          </span>
        </a>

        <!-- Links -->
        <div class="flex items-center gap-6">
          <a class="text-sm font-medium transition-standard hidden md:block cursor-pointer"
             [ngClass]="isScrolled ? 'text-secondary hover:text-primary' : 'text-white/80 hover:text-white'">
            About
          </a>
          <a class="text-sm font-medium transition-standard hidden md:block cursor-pointer"
             [ngClass]="isScrolled ? 'text-secondary hover:text-primary' : 'text-white/80 hover:text-white'">
            Reviews
          </a>
          <a [routerLink]="['/partner', partner?.slug, 'apply']" 
             class="text-sm font-medium transition-standard no-underline"
             [ngClass]="isScrolled ? 'text-primary border-b-2 border-primary' : 'text-white border-b-2 border-white'">
            Apply Now
          </a>
        </div>
      </div>
    </nav>
  `
})
export class PartnerNavbarComponent {
    @Input() partner: Partner | null = null;
    isScrolled = false;

    @HostListener('window:scroll', [])
    onWindowScroll() {
        this.isScrolled = window.scrollY > 20;
    }
}
