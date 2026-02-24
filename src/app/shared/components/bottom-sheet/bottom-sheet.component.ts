import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-bottom-sheet',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-40 transition-standard no-scroll">
      <!-- Backdrop -->
      <div 
        class="absolute inset-0 bg-[#0A2540] transition-standard"
        [style.opacity]="isOpen ? '0.85' : '0'"
        (click)="close.emit()">
      </div>
      
      <!-- Sheet -->
      <div 
        class="absolute bottom-0 left-0 right-0 bg-surface rounded-t-[24px] shadow-lg transition-standard"
        [style.transform]="isOpen ? 'translateY(0)' : 'translateY(100%)'"
        style="max-height: 90vh; overflow-y: auto;">
        
        <!-- Handle -->
        <div class="w-full flex justify-center pt-3 pb-1" (click)="close.emit()">
          <div class="w-12 h-1.5 bg-surface-3 rounded-full"></div>
        </div>
        
        <div class="p-6">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `
})
export class BottomSheetComponent {
    @Input() isOpen: boolean = false;
    @Output() close = new EventEmitter<void>();
}
