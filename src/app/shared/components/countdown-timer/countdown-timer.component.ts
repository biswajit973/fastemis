import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-countdown-timer',
    standalone: true,
    imports: [CommonModule],
    template: `
    <span class="font-mono font-medium" [ngClass]="{'text-error': isUrgent()}">
      {{ minutes() | number:'2.0-0' }}:{{ seconds() | number:'2.0-0' }}
    </span>
  `
})
export class CountdownTimerComponent implements OnInit, OnDestroy {
    @Input() targetDate!: string | Date; // ISO string or Date object
    @Output() expired = new EventEmitter<void>();

    minutes = signal<number>(0);
    seconds = signal<number>(0);
    isUrgent = signal<boolean>(false);

    private animationFrameId?: number;
    private hasFiredExp = false;

    ngOnInit() {
        this.updateClock();
    }

    updateClock = () => {
        const target = typeof this.targetDate === 'string' ? new Date(this.targetDate).getTime() : this.targetDate.getTime();
        const now = new Date().getTime();
        const diff = target - now;

        if (diff <= 0) {
            this.minutes.set(0);
            this.seconds.set(0);
            this.isUrgent.set(true);
            if (!this.hasFiredExp) {
                this.hasFiredExp = true;
                this.expired.emit();
            }
            return;
        }

        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        this.minutes.set(m);
        this.seconds.set(s);
        this.isUrgent.set(m === 0 && s < 60);

        this.animationFrameId = requestAnimationFrame(this.updateClock);
    }

    ngOnDestroy() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }
}
