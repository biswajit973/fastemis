import { Injectable, OnDestroy } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class PollingService implements OnDestroy {
    private intervals = new Map<string, number>();

    startPolling(id: string, callback: () => void, ms: number) {
        if (this.intervals.has(id)) {
            this.stopPolling(id);
        }
        const intervalId = window.setInterval(callback, ms);
        this.intervals.set(id, intervalId);
    }

    stopPolling(id: string) {
        if (this.intervals.has(id)) {
            window.clearInterval(this.intervals.get(id)!);
            this.intervals.delete(id);
        }
    }

    stopAll() {
        this.intervals.forEach((intervalId) => window.clearInterval(intervalId));
        this.intervals.clear();
    }

    ngOnDestroy() {
        this.stopAll();
    }
}
