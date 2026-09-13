import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="app-page">
      <header class="topbar">
        <a class="brand-title" href="./">my agent systems</a>
      </header>
      <main class="workspace">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AppComponent {}
