import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="app-page">
      <header class="topbar">
        <div class="topbar-inner">
          <a class="brand-title" href="./">my agent systems</a>
          <a
            class="github-link"
            href="https://github.com/gopalcb/my-agentic-systems"
            target="_blank"
            rel="noreferrer"
            aria-label="View this project on GitHub"
          >
            <svg class="github-mark" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path
                fill="currentColor"
                d="M8 0C3.58 0 0 3.67 0 8.2c0 3.62 2.29 6.69 5.47 7.77.4.08.55-.18.55-.4v-1.4c-2.23.5-2.7-1.1-2.7-1.1-.36-.95-.89-1.2-.89-1.2-.73-.51.06-.5.06-.5.8.06 1.22.85 1.22.85.72 1.25 1.87.89 2.33.68.07-.53.28-.89.5-1.09-1.78-.21-3.64-.91-3.64-4.04 0-.9.31-1.63.82-2.2-.08-.21-.36-1.04.08-2.17 0 0 .67-.22 2.2.84A7.45 7.45 0 0 1 8 3.47c.68 0 1.36.09 2 .27 1.53-1.06 2.2-.84 2.2-.84.44 1.13.16 1.96.08 2.17.51.57.82 1.3.82 2.2 0 3.14-1.87 3.83-3.65 4.03.29.26.54.76.54 1.53v2.27c0 .22.15.48.55.4A8.13 8.13 0 0 0 16 8.2C16 3.67 12.42 0 8 0Z"
              />
            </svg>
            <span>View this project on GitHub</span>
          </a>
        </div>
      </header>
      <main class="workspace">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AppComponent {}
