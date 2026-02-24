import { Directive, HostListener, OnInit, OnDestroy } from '@angular/core';
import { NotificationService } from '../../core/services/notification.service';

@Directive({
    selector: '[appScreenshotBlock]',
    standalone: true
})
export class ScreenshotBlockDirective implements OnInit, OnDestroy {

    constructor(private notification: NotificationService) { }

    ngOnInit() {
        // Basic CSS blocks applied globally, JS prevents interaction
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
    }

    ngOnDestroy() {
        document.body.style.userSelect = 'auto';
        document.body.style.webkitUserSelect = 'auto';
    }

    @HostListener('window:contextmenu', ['$event'])
    onRightClick(event: MouseEvent) {
        event.preventDefault();
    }

    @HostListener('window:keydown', ['$event'])
    onKeyDown(event: KeyboardEvent) {
        if (event.key === 'PrintScreen' ||
            (event.metaKey && event.shiftKey && (event.key === '3' || event.key === '4' || event.key === '5')) ||
            (event.ctrlKey && event.key === 'p')) {

            event.preventDefault();
            // Flash screen black temporarily to thwart screenshot captures slightly
            const blurDiv = document.createElement('div');
            blurDiv.style.position = 'fixed';
            blurDiv.style.inset = '0';
            blurDiv.style.backgroundColor = 'black';
            blurDiv.style.zIndex = '99999';
            document.body.appendChild(blurDiv);

            this.notification.warning("Screenshots/Printing are disabled for secure documents.");

            setTimeout(() => {
                document.body.removeChild(blurDiv);
            }, 500);
        }
    }
}
