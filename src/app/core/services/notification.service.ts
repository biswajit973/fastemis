import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ToastConfig {
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private toastSubject = new Subject<ToastConfig>();
    public toast$ = this.toastSubject.asObservable();

    show(config: ToastConfig | string) {
        if (typeof config === 'string') {
            this.toastSubject.next({ message: config, type: 'info', duration: 3000 });
        } else {
            this.toastSubject.next({
                ...config,
                type: config.type || 'info',
                duration: config.duration || 3000
            });
        }
    }

    success(message: string) {
        this.show({ message, type: 'success' });
    }

    error(message: string) {
        this.show({ message, type: 'error', duration: 5000 });
    }

    warning(message: string) {
        this.show({ message, type: 'warning' });
    }
}
