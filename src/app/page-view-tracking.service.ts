import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

declare global {
  interface Window {
    AGENT_SYSTEMS_PAGE_VIEW_ENDPOINT?: string;
  }
}

type PageViewPayload = {
  visit_id: string;
  page_link: string;
  route: string;
  page_title: string;
  timestamp: string;
  site: string;
};

@Injectable({ providedIn: 'root' })
export class PageViewTrackingService {
  private readonly router = inject(Router);
  private readonly visitId = this.createVisitId();
  private lastTrackedPageLink = '';

  constructor() {
    window.setTimeout(() => this.trackRoute(this.router.url), 0);

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.trackRoute(event.urlAfterRedirects));
  }

  private trackRoute(route: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    const endpoint = this.resolveEndpoint();
    if (!endpoint) {
      return;
    }

    const pageLink = window.location.href;
    if (pageLink === this.lastTrackedPageLink) {
      return;
    }
    this.lastTrackedPageLink = pageLink;

    const payload: PageViewPayload = {
      visit_id: this.visitId,
      page_link: pageLink,
      route,
      page_title: document.title,
      timestamp: new Date().toISOString(),
      site: 'my-agentic-systems',
    };

    void fetch(endpoint, {
      method: 'POST',
      mode: 'cors',
      keepalive: true,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    }).catch(() => {
      // Analytics should never disturb reading the article site.
    });
  }

  private resolveEndpoint(): string {
    return window.AGENT_SYSTEMS_PAGE_VIEW_ENDPOINT?.trim() ?? '';
  }

  private createVisitId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }

    return `visit-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}
