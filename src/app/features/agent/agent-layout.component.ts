import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AgentNavbarComponent } from './components/agent-navbar/agent-navbar.component';

@Component({
    selector: 'app-agent-layout',
    standalone: true,
    imports: [CommonModule, RouterOutlet, AgentNavbarComponent],
    template: `
    <div class="min-h-screen bg-surface-2">
      <app-agent-navbar></app-agent-navbar>
      
      <main class="py-8">
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class AgentLayoutComponent { }
