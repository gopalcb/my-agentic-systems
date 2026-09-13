import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { HeaderComponent } from './components/header/header.component';

@Component({
  selector: 'app-controller-demo',
  standalone: true,
  imports: [HeaderComponent, RouterOutlet],
  template: `
    <section class="controller-demo-shell" aria-label="Controller plane UI demo">
      <app-header />
      <main class="controller-demo-workspace">
        <router-outlet />
      </main>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        min-height: 100vh;
      }

      .controller-demo-shell {
        min-height: 100vh;
        overflow: hidden;
        background: var(--surface);
      }

      .controller-demo-workspace {
        min-width: 0;
        padding: 14px;
      }
      @media (max-width: 700px) {
        .controller-demo-workspace {
          padding: 10px;
        }
      }
    `,
  ],
})
export class ControllerDemoComponent {}
