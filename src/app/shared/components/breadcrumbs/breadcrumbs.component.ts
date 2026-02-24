import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { Subject, filter, startWith, takeUntil } from 'rxjs';

interface BreadcrumbItem {
  label: string;
  url: string;
}

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <nav *ngIf="items().length > 1" class="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] right-3 z-20">
      <button
        (click)="toggleExpanded()"
        class="inline-flex items-center gap-2 rounded-full border border-border bg-surface/95 backdrop-blur-md px-3 py-1.5 shadow-sm text-xs md:text-sm text-secondary hover:text-primary transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M3 12h13"></path>
          <path d="M3 18h9"></path>
        </svg>
        <span class="max-w-[30vw] md:max-w-[18rem] truncate">{{ items()[items().length - 1].label }}</span>
      </button>

      <div
        *ngIf="expanded()"
        class="mt-2 rounded-xl border border-border bg-surface/95 backdrop-blur-md p-2.5 shadow-md max-w-[88vw] md:max-w-[40rem]">
        <div class="flex items-center gap-1 overflow-x-auto hide-scrollbar">
          <ng-container *ngFor="let item of items(); let i = index">
            <a
              *ngIf="i < items().length - 1"
              [routerLink]="item.url"
              (click)="expanded.set(false)"
              class="text-secondary hover:text-primary no-underline whitespace-nowrap text-xs md:text-sm">
              {{ item.label }}
            </a>
            <span *ngIf="i === items().length - 1" class="text-primary font-medium whitespace-nowrap text-xs md:text-sm">{{ item.label }}</span>
            <span *ngIf="i < items().length - 1" class="text-muted px-1">/</span>
          </ng-container>
        </div>
      </div>
    </nav>
  `
})
export class BreadcrumbsComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  items = signal<BreadcrumbItem[]>([]);
  expanded = signal<boolean>(false);

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        startWith(null),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.buildBreadcrumbs());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleExpanded() {
    this.expanded.update(value => !value);
  }

  private buildBreadcrumbs() {
    const breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', url: '/' }];

    let currentRoute: ActivatedRoute | null = this.activatedRoute.root;
    let currentUrl = '';

    while (currentRoute?.firstChild) {
      currentRoute = currentRoute.firstChild;

      const routeConfig = currentRoute.routeConfig;
      const path = currentRoute.snapshot.url.map(segment => segment.path).join('/');

      if (path) {
        currentUrl += '/' + path;
      }

      if (!routeConfig || routeConfig.path === '**') {
        continue;
      }

      const dataLabel = currentRoute.snapshot.data['breadcrumb'] as string | undefined;
      const label = this.resolveLabel(dataLabel || routeConfig.path, currentRoute.snapshot.params);

      if (!label || label === 'Home') {
        continue;
      }

      breadcrumbs.push({ label, url: currentUrl || '/' });
    }

    this.items.set(breadcrumbs);
    this.expanded.set(false);
  }

  private resolveLabel(rawLabel: string | undefined, params: Record<string, string>): string {
    if (!rawLabel) return '';

    let label = rawLabel;
    Object.keys(params || {}).forEach(key => {
      label = label.replace(`:${key}`, params[key]);
    });

    if (label.includes('/')) {
      label = label.split('/').filter(Boolean).pop() || label;
    }

    if (!label) return '';
    return label
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }
}
