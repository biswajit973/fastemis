import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AgentNavbarComponent } from './components/agent-navbar/agent-navbar.component';

@Component({
  selector: 'app-agent-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, AgentNavbarComponent],
  template: `
    <div class="min-h-screen bg-surface-2 flex flex-col">
      <app-agent-navbar></app-agent-navbar>
      
      <main class="flex-1 py-8 px-4 sm:px-6 lg:px-8 mt-16 max-w-[1600px] mx-auto w-full">
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class AgentLayoutComponent { }
