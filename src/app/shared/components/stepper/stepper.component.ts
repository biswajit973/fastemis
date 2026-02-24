import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-stepper',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="flex items-center w-full relative mb-6">
      <ng-container *ngFor="let step of steps; let i = index; let last = last">
        <!-- Step Dot -->
        <div class="flex flex-col items-center relative z-10 flex-1">
          <div 
            class="w-6 h-6 rounded-full flex items-center justify-center transition-standard mb-2"
            [ngClass]="{
              'bg-primary text-white': i <= currentStepIndex,
              'bg-surface-3 text-muted border border-border': i > currentStepIndex
            }">
            <span *ngIf="i < currentStepIndex"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
            <span *ngIf="i >= currentStepIndex" class="text-xs font-mono font-medium">{{ i + 1 }}</span>
          </div>
          <span class="text-xs font-medium" [ngClass]="currentStepIndex === i ? 'text-primary' : 'text-muted'">{{ step }}</span>
        </div>
        
        <!-- Connecting Line -->
        <div *ngIf="!last" class="absolute flex-1 h-[2px] transition-standard z-0"
             [style.width]="(100 / steps.length) + '%'"
             [style.left]="((i * 100) / steps.length) + (50 / steps.length) + '%'"
             [style.top]="'12px'"
             [ngClass]="{
               'bg-primary': i < currentStepIndex,
               'bg-border': i >= currentStepIndex
             }">
        </div>
      </ng-container>
    </div>
  `
})
export class StepperComponent {
    @Input() steps: string[] = [];
    @Input() currentStepIndex: number = 0;
}
