import { Component, ElementRef, QueryList, ViewChildren, AfterViewInit, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-home-hero',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  styles: [`
    .hero-carousel-container {
      position: relative;
      width: min(100%, 22rem);
      height: 32rem;
      margin-left: auto;
      border-radius: 2rem;
      overflow: hidden;
      /* Soft glass container effect */
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      box-shadow: 
        0 25px 50px -12px rgba(20, 27, 35, 0.15), 
        0 8px 24px -4px rgba(20, 27, 35, 0.10);
    }
    
    .hero-carousel-video {
      position: absolute;
      inset: 0;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.8s ease-in-out, visibility 0.8s ease-in-out;
      transform: scale(1.05); /* Slight zoom out effect on active */
    }

    .hero-carousel-video.is-active {
      opacity: 1;
      visibility: visible;
      transform: scale(1);
      transition: opacity 0.8s ease-in-out, visibility 0.8s ease-in-out, transform 5s linear;
      z-index: 10;
    }
    
    /* Transparent merge effect into UI at bottom */
    .hero-carousel-fade-bottom {
      background: linear-gradient(to top, rgba(246, 248, 251, 1) 0%, rgba(246, 248, 251, 0.8) 15%, transparent 40%);
      pointer-events: none;
    }
  `],
  template: `
    <section class="pt-24 pb-12 md:pt-32 md:pb-20 relative overflow-hidden">
      <!-- Background SVG abstraction -->
      <div class="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E8F5E9" stroke-width="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <!-- Abstract chart lines -->
          <path d="M0 80 Q 200 150 400 50 T 800 100 T 1200 40" fill="none" stroke="#DDE3EC" stroke-width="2" />
          <path d="M0 120 Q 250 180 450 80 T 900 130 T 1200 60" fill="none" stroke="#f6f8fb" stroke-width="4" />
        </svg>
      </div>

      <div class="container relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-16">
        
        <!-- Left Content -->
        <div class="flex-1 flex flex-col items-center text-center md:items-start md:text-left fade-in">
          <h1 class="font-display text-4xl md:text-5xl lg:text-6xl text-primary leading-tight mb-4 tracking-tight">
            Finance Your Goals.<br/>
            No Branch Visits.<br/>
            <span class="text-accent relative inline-block">
              No Waiting Lines.
              <!-- Underline swoosh -->
              <svg class="absolute w-full h-3 -bottom-1 left-0 text-accent opacity-30" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 2" stroke="currentColor" stroke-width="4" fill="none" />
              </svg>
            </span>
          </h1>
          
          <p class="text-secondary text-base md:text-lg max-w-lg mb-8">
            Compare the world's trusted EMI partners, apply in minutes, and get your purchase financed &mdash; entirely online.
          </p>

          <!-- Trust Badges Row -->
          <div class="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-8">
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-3 border border-border rounded-full text-xs font-medium text-primary shadow-sm">
              <span>🔒</span> Globally Regulated
            </span>
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-3 border border-border rounded-full text-xs font-medium text-primary shadow-sm">
              <span>⚡</span> Instant Processing
            </span>
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-3 border border-border rounded-full text-xs font-medium text-primary shadow-sm hidden sm:flex">
              <span>🛡️</span> 256-bit Secure
            </span>
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-3 border border-border rounded-full text-xs font-medium text-primary shadow-sm hidden lg:flex">
              <span>✅</span> Licensed Institution
            </span>
          </div>

          <app-button variant="primary" [fullWidth]="false" class="w-full md:w-auto shadow-md" (onClick)="scrollToPartners()">
            Explore Finance Partners &rarr;
          </app-button>
        </div>

        <!-- Right Visual (Clean Single Video Carousel) -->
        <div class="flex-1 relative w-full h-[32rem] scale-in hidden md:block">
          <div class="hero-carousel-container" (mouseenter)="pauseAutoPlay()" (mouseleave)="resumeAutoPlay()">
            
            <!-- Pre-flight Validation Loader -->
            <div *ngIf="isLoading()" class="absolute inset-0 flex flex-col items-center justify-center bg-surface-2 z-50">
               <div class="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
               <div class="text-primary font-semibold text-lg animate-pulse">Checking Media Integrity...</div>
               <div class="text-secondary text-sm mb-4">{{ loadingProgress() }}% Verified</div>
               <div class="w-48 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                  <div class="h-full bg-primary transition-all duration-300 ease-out" [style.width.%]="loadingProgress()"></div>
               </div>
            </div>

            <ng-container *ngFor="let vid of validVideos(); let i = index">
              <article class="hero-carousel-video" [class.is-active]="activeIndex() === i">
                <!-- Video Element -->
                <video
                  #heroVideoEl
                  [attr.data-id]="vid.id"
                  [src]="vid.fileUrl"
                  class="w-full h-full object-cover pointer-events-none"
                  preload="metadata"
                  playsinline
                  [loop]="false"
                  [muted]="mutedState()[vid.id]"
                  [disablePictureInPicture]="true"
                  [attr.disableRemotePlayback]="'true'"
                  [attr.controlsList]="'nodownload nofullscreen noplaybackrate'"
                  (contextmenu)="$event.preventDefault()"
                  (ended)="onVideoEnded(i)">
                </video>

                <!-- Gradient Fade over Video Content for text legibility -->
                <div class="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none z-10 transition-opacity"></div>
                
                <!-- Transparent Bottom Cover (Matches Background surface) to blend into UI -->
                <div class="hero-carousel-fade-bottom absolute inset-x-0 bottom-0 h-32 z-10"></div>

                <!-- Information Overlay -->
                <div class="absolute bottom-6 left-6 right-6 z-20 pointer-events-none flex flex-col gap-3">
                   <div class="flex items-center gap-3">
                      <div class="flex flex-col">
                          <span class="text-white font-semibold text-lg drop-shadow-md leading-tight">{{ vid.name }}</span>
                          <span class="text-white/70 font-medium text-[11px] drop-shadow-md uppercase tracking-wider">Verified Customer</span>
                      </div>
                  </div>
                  <p class="text-white/90 text-sm md:text-base leading-relaxed drop-shadow-sm font-medium">"{{ vid.quote }}"</p>
                </div>
              </article>
            </ng-container>

            <!-- Central Play/Pause Toggle -->
            <button
              type="button"
              (click)="togglePlay()"
              class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-12 w-12 md:h-14 md:w-14 rounded-full bg-black/10 backdrop-blur-md text-white border border-white/10 flex items-center justify-center hover:bg-black/30 hover:scale-105 transition-all z-[60] shadow-2xl cursor-pointer">
              <svg *ngIf="!isPlaying()" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="ml-0.5 opacity-20 hover:opacity-100 transition-opacity">
                <path d="M8 5.5v13l10-6.5z"></path>
              </svg>
              <svg *ngIf="isPlaying()" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="opacity-20 hover:opacity-100 transition-opacity">
                <rect x="7" y="5" width="4" height="14" rx="1"></rect>
                <rect x="13" y="5" width="4" height="14" rx="1"></rect>
              </svg>
            </button>

            <!-- Global Mini Sound/Mute Icon (Top Right) -->
            <button
               type="button"
               (click)="toggleCurrentAudio()"
               class="absolute top-5 right-5 z-[60] w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/60 transition-colors shadow-lg group cursor-pointer"
               [title]="isCurrentMuted() ? 'Unmute' : 'Mute'">
               <svg *ngIf="isCurrentMuted()" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                   <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
                   <line x1="23" y1="9" x2="17" y2="15"></line>
                   <line x1="17" y1="9" x2="23" y2="15"></line>
               </svg>
               <svg *ngIf="!isCurrentMuted()" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                   <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
                   <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                   <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
               </svg>
            </button>

            <!-- Floating Arrow Controls (Up/Down Layout) tightly inside the container -->
            <div class="absolute right-4 top-1/2 -translate-y-1/2 z-[60] flex flex-col gap-3">
               <button
                 type="button"
                 (click)="manualPrev()"
                 class="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md shadow-lg border border-white/20 flex items-center justify-center text-white hover:bg-black/60 transition-all group cursor-pointer"
                 aria-label="Previous Video">
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="group-hover:-translate-y-0.5 transition-transform"><polyline points="18 15 12 9 6 15"></polyline></svg>
               </button>
               <button
                 type="button"
                 (click)="manualNext()"
                 class="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md shadow-lg border border-white/20 flex items-center justify-center text-white hover:bg-black/60 transition-all group cursor-pointer"
                 aria-label="Next Video">
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="group-hover:translate-y-0.5 transition-transform"><polyline points="6 9 12 15 18 9"></polyline></svg>
               </button>
            </div>
            
          </div>
        </div>
      </div>
    </section>
  `
})
export class HomeHeroComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('heroVideoEl') private videoEls!: QueryList<ElementRef<HTMLVideoElement>>;

  private readonly rawHeroVideos = [
    { id: 'h1', fileUrl: '/mediaFiles/customervideos/Ratikanta.mp4', name: 'Ratikanta M.', quote: 'The instant EMI process entirely online changed everything. No branch visits!' },
    { id: 'h2', fileUrl: '/mediaFiles/customervideos/monica.mp4', name: 'Monica S.', quote: 'Approved in 5 minutes and I bought my MacBook immediately. Flawless.' },
    { id: 'h3', fileUrl: '/mediaFiles/customervideos/sreekanth.mp4', name: 'Sreekanth P.', quote: 'No waiting lines! FastEMIs connected me to the best partner seamlessly.' },
    { id: 'h4', fileUrl: '/mediaFiles/customervideos/ritika.mp4', name: 'Ritika K.', quote: 'The transparent fees and instant approval saved me so much hassle.' },
    { id: 'h5', fileUrl: '/mediaFiles/customervideos/Rudra.mp4', name: 'Rudra T.', quote: 'I was skeptical, but the zero hidden fees part is 100% real!' },
    { id: 'h6', fileUrl: '/mediaFiles/customervideos/abhilash.mp4', name: 'Abhilash D.', quote: 'Finally, a platform that understands modern retail financing.' },
    { id: 'h7', fileUrl: '/mediaFiles/customervideos/Damayanti Nayak.mp4', name: 'Damayanti N.', quote: 'Super fast approval and great customer service. Highly recommended!' },
    { id: 'h8', fileUrl: '/mediaFiles/customervideos/Jayakrishna Goswami.mp4', name: 'Jayakrishna G.', quote: 'I got my mobile phone on EMI without a credit card. Amazing service.' },
    { id: 'h9', fileUrl: '/mediaFiles/customervideos/Maya Sa.mp4', name: 'Maya S.', quote: 'The whole process is paperless and very straightforward. Thank you FastEMIs.' },
    { id: 'h10', fileUrl: '/mediaFiles/customervideos/Nayan Sharma.mp4', name: 'Nayan S.', quote: 'Flexible repayment options made my large purchase very easy to manage.' },
    { id: 'h11', fileUrl: '/mediaFiles/customervideos/Padmanava Rao.mp4', name: 'Padmanava R.', quote: 'Trustworthy and transparent. I will definitely use this again.' },
    { id: 'h12', fileUrl: '/mediaFiles/customervideos/Preetam Das.mp4', name: 'Preetam D.', quote: 'Checked my eligibility in seconds. The quickest loan processing ever.' },
    { id: 'h13', fileUrl: '/mediaFiles/customervideos/Rohit.mp4', name: 'Rohit K.', quote: 'Upgraded my home appliances with zero down payment. Brilliant.' },
    { id: 'h14', fileUrl: '/mediaFiles/customervideos/josephKerala.mp4', name: 'Joseph K.', quote: 'Very impressed with the security and the speed of disbursement.' },
    { id: 'h15', fileUrl: '/mediaFiles/customervideos/payal Khemka.mp4', name: 'Payal K.', quote: 'The interface is beautiful and so simple to navigate.' },
    { id: 'h16', fileUrl: '/mediaFiles/customervideos/subhaprada.mp4', name: 'Subhaprada P.', quote: 'I recommend FastEMIs to all my friends. Truly the future of payments.' }
  ];

  readonly validVideos = signal<any[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly loadingProgress = signal<number>(0);

  readonly activeIndex = signal<number>(0);
  readonly mutedState = signal<Record<string, boolean>>({});
  readonly isPlaying = signal<boolean>(true);

  private autoPlayTimer: any;
  private isHoverPaused = false;

  async ngOnInit(): Promise<void> {
    const valid = [];
    let checked = 0;

    // Validate each video exists before letting it into the carousel array
    for (const v of this.rawHeroVideos) {
      try {
        const response = await fetch(v.fileUrl, { method: 'HEAD' });
        if (response.ok) {
          valid.push(v);
        }
      } catch (e) {
        // Silently fail, file not found or network error, skip adding
      }
      checked++;
      this.loadingProgress.set(Math.round((checked / this.rawHeroVideos.length) * 100));
    }

    this.validVideos.set(valid);
    this.isLoading.set(false);

    const initialMuted: Record<string, boolean> = {};
    valid.forEach(v => initialMuted[v.id] = false);
    this.mutedState.set(initialMuted);

    // Safety check if no videos loaded
    if (valid.length > 0) {
      setTimeout(() => {
        this.playActiveVideo();
        this.startAutoCarousel();
      }, 100);
    }
  }

  ngAfterViewInit(): void {
    // Moved to ngOnInit after layout validation settles
  }

  ngOnDestroy(): void {
    this.clearAutoCarousel();
  }

  startAutoCarousel() {
    this.clearAutoCarousel();
    if (this.validVideos().length <= 1) return; // No point carouseling 0 or 1 video

    if (!this.isHoverPaused) {
      // Advances every 5 seconds if the video hasn't ended naturally
      this.autoPlayTimer = setInterval(() => {
        this.manualNext();
      }, 5000);
    }
  }

  clearAutoCarousel() {
    if (this.autoPlayTimer) clearInterval(this.autoPlayTimer);
  }

  pauseAutoPlay() {
    this.isHoverPaused = true;
    this.clearAutoCarousel();
  }

  resumeAutoPlay() {
    this.isHoverPaused = false;
    this.startAutoCarousel();
  }

  onVideoEnded(index: number) {
    // Automatically advance to the next video instantly when current natural ends if earlier than 5s
    if (index === this.activeIndex() && !this.isHoverPaused) {
      this.manualNext();
    }
  }

  playActiveVideo() {
    if (this.validVideos().length === 0) return;
    this.isPlaying.set(true);
    this.videoEls.forEach((ref, index) => {
      const video = ref.nativeElement;
      if (index === this.activeIndex()) {
        video.currentTime = 0; // reset
        void video.play().catch(() => { });
      } else {
        video.pause();
      }
    });
  }

  togglePlay() {
    const video = this.videoEls.get(this.activeIndex())?.nativeElement;
    if (video) {
      if (video.paused) {
        void video.play();
        this.isPlaying.set(true);
        this.startAutoCarousel();
      } else {
        video.pause();
        this.isPlaying.set(false);
        this.clearAutoCarousel(); // halt auto progression if manually paused
      }
    }
  }

  isCurrentMuted(): boolean {
    const activeVideo = this.validVideos()[this.activeIndex()];
    return this.mutedState()[activeVideo.id] ?? true;
  }

  toggleCurrentAudio(): void {
    const activeRecord = this.validVideos()[this.activeIndex()];
    const nextMuted: Record<string, boolean> = { ...this.mutedState() };

    const vEl = this.videoEls.get(this.activeIndex())?.nativeElement;
    if (vEl) {
      const isMutedNow = vEl.muted;
      vEl.muted = !isMutedNow;
      nextMuted[activeRecord.id] = !isMutedNow;

      // Mute all others just in case
      this.videoEls.forEach((ref, i) => {
        if (i !== this.activeIndex()) {
          ref.nativeElement.muted = true;
          const oId = this.validVideos()[i].id;
          nextMuted[oId] = true;
        }
      });
    }

    this.mutedState.set(nextMuted);
  }

  manualNext() {
    if (this.validVideos().length <= 1) return;
    this.clearAutoCarousel();
    this.activeIndex.update(idx => (idx + 1) % this.validVideos().length);
    this.playActiveVideo();
    this.startAutoCarousel();
  }

  manualPrev() {
    if (this.validVideos().length <= 1) return;
    this.clearAutoCarousel();
    this.activeIndex.update(idx => (idx - 1 + this.validVideos().length) % this.validVideos().length);
    this.playActiveVideo();
    this.startAutoCarousel();
  }

  scrollToPartners() {
    const el = document.getElementById('partnersList');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
