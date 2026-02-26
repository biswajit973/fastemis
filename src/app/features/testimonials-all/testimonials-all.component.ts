import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, QueryList, ViewChildren, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

interface TestimonialVideo {
  id: string;
  fileUrl: string;
  uniqueId?: string;
}

@Component({
  selector: 'app-testimonials-all',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <section class="min-h-screen bg-surface-2 pt-24 pb-12 px-4 md:px-8 secure-zone relative overflow-hidden flex flex-col">
      <div class="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-accent/10 blur-3xl"></div>
      <div class="pointer-events-none absolute top-32 -left-20 w-64 h-64 rounded-full bg-primary/5 blur-3xl"></div>

      <div class="max-w-7xl mx-auto w-full relative z-10 flex-1 flex flex-col">
        <header class="text-center mb-10 mt-4 md:mt-8">
          <h1 class="text-3xl md:text-5xl font-display font-extrabold text-primary leading-tight tracking-tight">
            1,000s of Happy Customers — All Around the World
          </h1>
          <p class="text-secondary mt-5 max-w-3xl mx-auto text-base md:text-lg font-medium leading-relaxed">
            Once you receive your parcel, unbox it, use it, and if you're satisfied — send us your testimonial video. We'll reward you with a <span class="text-accent font-bold">flat ₹1,000 off</span> your next order.
          </p>
        </header>

        <div class="flex items-center justify-between mb-4 w-full px-2 md:px-0">
            <button
              type="button"
              (click)="toggleGlobalMarquee()"
              class="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-primary hover:border-primary/50 transition-colors shadow-sm">
              <svg *ngIf="!globalMarqueePaused" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1"></rect>
                <rect x="14" y="4" width="4" height="16" rx="1"></rect>
              </svg>
              <svg *ngIf="globalMarqueePaused" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"></path>
              </svg>
              {{ globalMarqueePaused ? 'Resume Scroll' : 'Pause Scroll' }}
            </button>
            
            <div class="flex items-center gap-2">
              <button
                type="button"
                (mousedown)="startScrub(-1)"
                (mouseup)="stopScrub()"
                (mouseleave)="stopScrub()"
                (touchstart)="startScrub(-1)"
                (touchend)="stopScrub()"
                class="w-10 h-10 rounded-full border border-border bg-surface text-primary shadow-sm flex items-center justify-center hover:bg-surface-3 transition-colors active:scale-95 touch-manipulation"
                aria-label="Scroll left quickly">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
               <button
                type="button"
                (mousedown)="startScrub(1)"
                (mouseup)="stopScrub()"
                (mouseleave)="stopScrub()"
                (touchstart)="startScrub(1)"
                (touchend)="stopScrub()"
                class="w-10 h-10 rounded-full border border-border bg-surface text-primary shadow-sm flex items-center justify-center hover:bg-surface-3 transition-colors active:scale-95 touch-manipulation"
                aria-label="Scroll right quickly">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>
        </div>

        <div
          #scrollContainer
          class="relative w-[100vw] left-1/2 -translate-x-1/2 overflow-x-auto no-scrollbar select-none cursor-grab active:cursor-grabbing pb-8"
          (mouseenter)="setHoverPaused(true)"
          (mouseleave)="setHoverPaused(false)"
          (touchstart)="setHoverPaused(true)"
          (touchend)="setHoverPaused(false)"
          (wheel)="onWheel($event)"
          >
          <div class="flex items-center gap-4 md:gap-6 min-w-max px-[50vw]">
            <article
              *ngFor="let item of marqueeVideos; trackBy: trackByUniqueId"
              class="relative flex-none w-[260px] sm:w-[300px] md:w-[320px] aspect-[4/5] rounded-[2rem] overflow-hidden bg-surface-3 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-border/50 group"
              [class.ring-2]="playingState()[item.uniqueId || '']"
              [class.ring-primary]="playingState()[item.uniqueId || '']"
              [class.ring-offset-2]="playingState()[item.uniqueId || '']"
              [class.ring-offset-surface-2]="playingState()[item.uniqueId || '']"
              >
              
              <!-- Skeleton Loader -->
              <div *ngIf="!videoReady()[item.uniqueId || '']" class="absolute inset-0 bg-surface-3 animate-pulse z-10 flex items-center justify-center">
                 <div class="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              </div>

              <!-- Gradient Overlay (Bottom) for better control visibility -->
              <div class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none z-10 opacity-70 group-hover:opacity-100 transition-opacity"></div>
              <!-- Gradient Overlay (Top) -->
              <div class="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/50 to-transparent pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <video
                #videoEl
                [attr.data-uid]="item.uniqueId"
                [attr.data-id]="item.id"
                class="w-full h-full object-cover pointer-events-none"
                preload="metadata"
                playsinline
                loop
                [muted]="mutedState()[item.uniqueId || '']"
                [disablePictureInPicture]="true"
                [attr.disableRemotePlayback]="'true'"
                [attr.controlsList]="'nodownload nofullscreen noplaybackrate'"
                (canplay)="onVideoReady(item.uniqueId!)"
                (loadeddata)="onVideoReady(item.uniqueId!)"
                (play)="onPlay(item.uniqueId!)"
                (pause)="onPause(item.uniqueId!)">
                <source [src]="item.fileUrl" type="video/mp4" />
              </video>

              <!-- Central Play/Pause Toggle -->
              <button
                type="button"
                (click)="togglePlay(item.uniqueId!); $event.stopPropagation()"
                class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 md:h-20 md:w-20 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/30 flex items-center justify-center hover:bg-black/60 hover:scale-105 transition-all z-20 shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100"
                [class.!opacity-100]="!playingState()[item.uniqueId || '']"
                [class.!scale-100]="!playingState()[item.uniqueId || '']"
                >
                <svg *ngIf="!playingState()[item.uniqueId || '']" width="28" height="28" viewBox="0 0 24 24" fill="currentColor" class="ml-1">
                  <path d="M8 5.5v13l10-6.5z"></path>
                </svg>
                <svg *ngIf="playingState()[item.uniqueId || '']" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="7" y="5" width="4" height="14" rx="1"></rect>
                  <rect x="13" y="5" width="4" height="14" rx="1"></rect>
                </svg>
              </button>

              <!-- Bottom Controls Row -->
              <div class="absolute bottom-4 left-4 right-4 flex items-center justify-between z-20">
                <span class="text-white/90 font-semibold text-sm drop-shadow-md tracking-tight">Customer Story</span>
                
                <!-- Mute Toggle -->
                <button
                  type="button"
                  (click)="toggleAudio(item.uniqueId!); $event.stopPropagation()"
                  class="h-10 w-10 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/20 flex items-center justify-center hover:bg-black/60 transition-colors shadow-sm">
                  <svg *ngIf="mutedState()[item.uniqueId || '']" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
                    <line x1="23" y1="9" x2="17" y2="15"></line>
                    <line x1="17" y1="9" x2="23" y2="15"></line>
                  </svg>
                  <svg *ngIf="!mutedState()[item.uniqueId || '']" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                  </svg>
                </button>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .secure-zone {
      user-select: none;
      -webkit-user-select: none;
      -webkit-touch-callout: none;
    }
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `]
})
export class TestimonialsAllComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('videoEl') private videoEls!: QueryList<ElementRef<HTMLVideoElement>>;
  @ViewChildren('scrollContainer', { read: ElementRef }) private scrollContainerEls!: QueryList<ElementRef<HTMLDivElement>>;

  private disposers: Array<() => void> = [];
  private animationFrameId: number | null = null;

  private hoverPaused = false;
  private activeVideoPaused = false; // true if any video is actively playing w/ sound
  globalMarqueePaused = false; // user clicked pause
  private scrubDirection: number = 0; // -1 for left, 1 for right, 0 for none
  private baseScrollSpeed = 0.5;
  private scrubSpeed = 8;

  readonly rawVideos: TestimonialVideo[] = [
    { id: 't1', fileUrl: '/mediaFiles/customervideos/Ratikanta.mp4' },
    { id: 't2', fileUrl: '/mediaFiles/customervideos/Rudra.mp4' },
    { id: 't3', fileUrl: '/mediaFiles/customervideos/abhilash.mp4' },
    { id: 't4', fileUrl: '/mediaFiles/customervideos/monica.mp4' },
    { id: 't5', fileUrl: '/mediaFiles/customervideos/ritika.mp4' },
    { id: 't6', fileUrl: '/mediaFiles/customervideos/sreekanth.mp4' }
  ];

  // Duplicate the array many times to create a long continuous loop feel
  readonly marqueeVideos: TestimonialVideo[] = Array(12).fill(this.rawVideos).flat().map((v, i) => ({
    ...v,
    uniqueId: `${v.id}-${i}`
  }));

  readonly playingState = signal<Record<string, boolean>>({});
  readonly mutedState = signal<Record<string, boolean>>({});
  readonly videoReady = signal<Record<string, boolean>>({});

  ngOnInit(): void {
    this.enableInteractionGuards();

    // Initialize state
    const initialMuted: Record<string, boolean> = {};
    const initialPlaying: Record<string, boolean> = {};
    const initialReady: Record<string, boolean> = {};
    this.marqueeVideos.forEach(v => {
      initialMuted[v.uniqueId!] = true;
      initialPlaying[v.uniqueId!] = false;
      initialReady[v.uniqueId!] = false;
    });
    this.mutedState.set(initialMuted);
    this.playingState.set(initialPlaying);
    this.videoReady.set(initialReady);
  }

  ngAfterViewInit(): void {
    this.videoEls.forEach(ref => {
      const video = ref.nativeElement;
      video.controls = false;
      video.disablePictureInPicture = true;
      video.addEventListener('contextmenu', event => event.preventDefault());
    });

    // Start marquee loop
    this.startRenderLoop();

    // Start autoplaying all muted videos ideally after a slight delay
    setTimeout(() => {
      this.videoEls.forEach(ref => {
        const v = ref.nativeElement;
        v.muted = true;
        void v.play().catch(() => { }); // catch autoplay policies
      });
    }, 500);

    // Scroll to middle initial position to allow left/right scrolling
    setTimeout(() => {
      const container = this.scrollContainerEls.first?.nativeElement;
      if (container) {
        container.scrollLeft = container.scrollWidth / 2 - container.clientWidth / 2;
      }
    }, 100);
  }

  ngOnDestroy(): void {
    this.disposers.forEach(dispose => dispose());
    this.disposers = [];
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.videoEls?.forEach(ref => ref.nativeElement.pause());
  }

  trackByUniqueId(_index: number, item: TestimonialVideo): string {
    return item.uniqueId!;
  }

  onVideoReady(uid: string): void {
    this.videoReady.update(prev => ({ ...prev, [uid]: true }));
  }

  toggleGlobalMarquee(): void {
    this.globalMarqueePaused = !this.globalMarqueePaused;
  }

  setHoverPaused(paused: boolean): void {
    this.hoverPaused = paused;
  }

  startScrub(direction: number): void {
    this.scrubDirection = direction;
  }

  stopScrub(): void {
    this.scrubDirection = 0;
  }

  onWheel(event: WheelEvent): void {
    const container = this.scrollContainerEls.first?.nativeElement;
    if (!container) return;
    container.scrollLeft += event.deltaX;
  }

  togglePlay(uid: string): void {
    const video = this.getVideoByUid(uid);
    if (!video) return;

    if (video.paused) {
      // Pause all others and mute all others
      this.pauseAllExcept(uid);
      this.muteAllExcept(uid);

      // Make active
      video.muted = false;
      this.mutedState.update(prev => ({ ...prev, [uid]: false }));
      this.activeVideoPaused = true; // halt marquee

      void video.play();
      this.centerVideoInViewport(video);
    } else {
      video.pause();
      this.activeVideoPaused = false;

      // Resume others (muted)
      this.videoEls.forEach(ref => {
        if (ref.nativeElement !== video) {
          ref.nativeElement.muted = true;
          void ref.nativeElement.play().catch(() => { });
        }
      });
    }
  }

  toggleAudio(uid: string): void {
    const video = this.getVideoByUid(uid);
    if (!video) return;

    if (video.muted) {
      this.muteAllExcept(uid);
      video.muted = false;
      this.mutedState.update(prev => ({ ...prev, [uid]: false }));

      if (!video.paused) {
        this.activeVideoPaused = true; // active playback halts marquee
        this.centerVideoInViewport(video);
      } else {
        void video.play();
        this.activeVideoPaused = true;
        this.centerVideoInViewport(video);
      }
    } else {
      video.muted = true;
      this.mutedState.update(prev => ({ ...prev, [uid]: true }));
      this.activeVideoPaused = false; // marquee can resume
    }
  }

  onPlay(uid: string): void {
    this.playingState.update(prev => ({ ...prev, [uid]: true }));
  }

  onPause(uid: string): void {
    this.playingState.update(prev => ({ ...prev, [uid]: false }));
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.isBlockedShortcut(event)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
  }

  private pauseAllExcept(activeUid: string): void {
    this.videoEls.forEach(ref => {
      const video = ref.nativeElement;
      const uid = video.dataset['uid'];
      if (uid !== activeUid) {
        video.pause();
      }
    });
  }

  private muteAllExcept(activeUid: string): void {
    const nextMuted: Record<string, boolean> = { ...this.mutedState() };
    this.videoEls.forEach(ref => {
      const video = ref.nativeElement;
      const uid = video.dataset['uid'];
      if (!uid) return;

      const isMuted = uid !== activeUid;
      video.muted = isMuted;
      nextMuted[uid] = isMuted;
    });
    this.mutedState.set(nextMuted);
  }

  private getVideoByUid(uid: string): HTMLVideoElement | null {
    const found = this.videoEls.find(ref => ref.nativeElement.dataset['uid'] === uid);
    return found?.nativeElement ?? null;
  }

  private centerVideoInViewport(video: HTMLVideoElement): void {
    const container = this.scrollContainerEls.first?.nativeElement;
    if (!container) return;

    const article = video.closest('article');
    if (!article) return;

    const offsetPos = article.offsetLeft - (container.clientWidth / 2) + (article.clientWidth / 2);
    container.scrollTo({ left: offsetPos, behavior: 'smooth' });
  }

  private startRenderLoop(): void {
    const step = () => {
      const container = this.scrollContainerEls.first?.nativeElement;
      if (container) {

        if (this.scrubDirection !== 0) {
          container.scrollLeft += this.scrubDirection * this.scrubSpeed;
        } else if (!this.globalMarqueePaused && !this.hoverPaused && !this.activeVideoPaused) {
          container.scrollLeft += this.baseScrollSpeed;
        }

        // Infinite loop reset logic
        const maxScroll = container.scrollWidth - container.clientWidth;
        if (maxScroll > 0) {
          // If we reach near the end, jump back to middle sections
          if (container.scrollLeft >= maxScroll - 100) {
            container.scrollLeft = container.scrollWidth / 2 - container.clientWidth / 2;
          }
          // If scrubbing left hits the beginning
          if (container.scrollLeft <= 100) {
            container.scrollLeft = container.scrollWidth / 2 - container.clientWidth / 2;
          }
        }
      }
      this.animationFrameId = requestAnimationFrame(step);
    };
    this.animationFrameId = requestAnimationFrame(step);
  }

  private isBlockedShortcut(event: KeyboardEvent): boolean {
    const key = event.key.toLowerCase();
    const ctrlOrMeta = event.ctrlKey || event.metaKey;

    if (event.key === 'F12') {
      return true;
    }
    if (ctrlOrMeta && event.shiftKey && ['i', 'j', 'c', 'k', 's'].includes(key)) {
      return true;
    }
    if (ctrlOrMeta && ['u', 's', 'p'].includes(key)) {
      return true;
    }
    return false;
  }

  private enableInteractionGuards(): void {
    const prevent = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
    };

    const bindings: Array<[EventTarget, string, EventListener]> = [
      [document, 'contextmenu', prevent],
      [document, 'copy', prevent],
      [document, 'cut', prevent],
      [document, 'paste', prevent],
      [document, 'selectstart', prevent],
      [document, 'dragstart', prevent]
    ];

    bindings.forEach(([target, name, handler]) => {
      target.addEventListener(name, handler, { capture: true });
      this.disposers.push(() => target.removeEventListener(name, handler, { capture: true } as EventListenerOptions));
    });
  }
}
