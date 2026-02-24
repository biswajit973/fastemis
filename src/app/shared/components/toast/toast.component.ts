import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, ToastConfig } from '../../../core/services/notification.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-toast',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="fixed top-4 left-0 right-0 z-50 flex flex-col items-center pointer-events-none gap-2 px-4">
      <div *ngFor="let toast of toasts(); let i = index" 
           class="slide-up max-w-md w-full bg-surface shadow-lg rounded-md border-l-4 p-4 flex items-start pointer-events-auto"
           [ngClass]="{
             'border-success': toast.type === 'success',
             'border-error': toast.type === 'error',
             'border-warning': toast.type === 'warning',
             'border-primary': toast.type === 'info'
           }">
        
        <div class="flex-1">
          <p class="text-sm font-medium text-primary">{{ toast.message }}</p>
        </div>
        
        <button (click)="removeToast(i)" class="text-muted hover:text-primary ml-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    </div>
  `
})
export class ToastComponent implements OnInit {
    private notificationService = inject(NotificationService);
    toasts = signal<(ToastConfig & { id: number })[]>([]);
    private toastId = 0;

    constructor() {
        this.notificationService.toast$
            .pipe(takeUntilDestroyed())
            .subscribe(config => {
                this.addToast(config);
            });
    }

    ngOnInit() { }

    addToast(config: ToastConfig) {
        const id = this.toastId++;
        const toast = { ...config, id };

        this.toasts.update(t => [...t, toast]);

        if (config.duration) {
            setTimeout(() => {
                this.removeById(id);
            }, config.duration);
        }
    }

    removeToast(index: number) {
        this.toasts.update(t => t.filter((_, i) => i !== index));
    }

    removeById(id: number) {
        this.toasts.update(t => t.filter(toast => toast.id !== id));
    }
}
