import { Component, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-global-security',
    standalone: true,
    template: ''
})
export class GlobalSecurityComponent {

    constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

    @HostListener('document:contextmenu', ['$event'])
    onContextMenu(event: MouseEvent) {
        if (environment.disableInspect && isPlatformBrowser(this.platformId)) {
            event.preventDefault();
        }
    }

    @HostListener('document:keydown', ['$event'])
    onKeyDown(event: KeyboardEvent) {
        if (!environment.disableInspect || !isPlatformBrowser(this.platformId)) {
            return;
        }

        // Block F12
        if (event.key === 'F12') {
            event.preventDefault();
            return;
        }

        // Block Inspect & View Source Combinations
        if ((event.ctrlKey || event.metaKey) && event.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(event.key)) {
            event.preventDefault();
            return;
        }

        // Block Ctrl+U (Windows/Linux) or Cmd+Opt+U (Mac) - View Source
        if ((event.ctrlKey || event.metaKey) && ['U', 'u'].includes(event.key)) {
            event.preventDefault();
            return;
        }
    }
}
