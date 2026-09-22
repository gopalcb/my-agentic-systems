import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

declare global {
  interface Window {
    AGENT_SYSTEMS_LOGGING_ENDPOINT?: string;
  }
}

type PageDetailsPayload = {
  visit_id: string;
  timestamp: string;
  timezone: string;
};

@Injectable({ providedIn: 'root' })
export class VisitLoggingService {
  private readonly router = inject(Router);
  private readonly visitId = this.createVisitId();
  private lastLoggedUrl = '';

  constructor() {
    window.setTimeout(() => this.logPageDetails(), 0);
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.logPageDetails());
  }

  private logPageDetails(): void {
    if (typeof window === 'undefined') {
      return;
    }
    const endpoint = window.AGENT_SYSTEMS_LOGGING_ENDPOINT?.trim() ?? '';
    if (!endpoint || window.location.href === this.lastLoggedUrl) {
      return;
    }
    this.lastLoggedUrl = window.location.href;
    const payload: PageDetailsPayload = {
      visit_id: this.visitId,
      timestamp: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'unknown',
    };

    void fetch(endpoint, {
      method: 'POST',
      mode: 'cors',
      keepalive: true,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {
      // Page-detail collection must never interrupt article reading.
    });
  }

  private createVisitId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `visit-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}
