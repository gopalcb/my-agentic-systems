import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

declare global {
  interface Window {
    AGENT_SYSTEMS_LOGGING_ENDPOINT?: string;
  }
}

type VisitLogPayload = {
  visit_id: string;
  page_link: string;
  route: string;
  page_title: string;
  timestamp: string;
  site: string;
  browser: BrowserVisitContext;
};

type BrowserVisitContext = {
  timezone: string;
  timezone_area: string;
  timezone_city: string;
  locale: string;
  country_hint: string;
  languages: string[];
  platform: string;
  screen: string;
  viewport: string;
  referrer: string;
};

@Injectable({ providedIn: 'root' })
export class VisitLoggingService {
  private readonly router = inject(Router);
  private readonly visitId = this.createVisitId();
  private lastLoggedPageLink = '';

  constructor() {
    window.setTimeout(() => this.logRoute(this.router.url), 0);

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.logRoute(event.urlAfterRedirects));
  }

  private logRoute(route: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    const endpoint = this.resolveEndpoint();
    if (!endpoint) {
      return;
    }

    const pageLink = window.location.href;
    if (pageLink === this.lastLoggedPageLink) {
      return;
    }
    this.lastLoggedPageLink = pageLink;

    const payload: VisitLogPayload = {
      visit_id: this.visitId,
      page_link: pageLink,
      route,
      page_title: document.title,
      timestamp: new Date().toISOString(),
      site: 'my-agentic-systems',
      browser: this.readBrowserContext(),
    };

    void fetch(endpoint, {
      method: 'POST',
      mode: 'cors',
      keepalive: true,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ param: this.encodePayload(payload) }),
    }).catch(() => {
      // Visit logging should never interrupt reading the article site.
    });
  }

  private resolveEndpoint(): string {
    return window.AGENT_SYSTEMS_LOGGING_ENDPOINT?.trim() ?? '';
  }

  private readBrowserContext(): BrowserVisitContext {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
    const locale = navigator.language ?? '';
    const timezoneParts = timezone.split('/');

    return {
      timezone,
      timezone_area: timezoneParts[0] ?? '',
      timezone_city: this.normalizeTimezoneCity(timezoneParts.slice(1).join('/')),
      locale,
      country_hint: this.readCountryHint(locale),
      languages: Array.from(navigator.languages ?? []),
      platform: navigator.platform ?? '',
      screen: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      referrer: document.referrer,
    };
  }

  private readCountryHint(locale: string): string {
    try {
      return new Intl.Locale(locale).region ?? '';
    } catch {
      const parts = locale.split('-');
      return parts.length > 1 ? parts.at(-1) ?? '' : '';
    }
  }

  private normalizeTimezoneCity(value: string): string {
    return value.replace(/_/g, ' ');
  }

  private encodePayload(payload: VisitLogPayload): string {
    const json = JSON.stringify(payload);
    return btoa(unescape(encodeURIComponent(json)));
  }

  private createVisitId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }

    return `visit-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}
