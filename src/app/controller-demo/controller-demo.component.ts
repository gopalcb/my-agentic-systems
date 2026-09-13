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
        width: min(1260px, 100%);
        margin: 0 auto;
      }

      .controller-demo-shell {
        min-height: calc(100vh - 82px);
        overflow: hidden;
        border: 1px solid var(--border);
        border-radius: 3px;
        background: var(--surface);
        box-shadow: var(--shadow);
      }

      .controller-demo-workspace {
        min-width: 0;
        padding: 14px;
      }

      @media (max-width: 700px) {
        :host {
          width: 100%;
        }

        .controller-demo-workspace {
          padding: 10px;
        }
      }
    `,
  ],
})
export class ControllerDemoComponent {}
