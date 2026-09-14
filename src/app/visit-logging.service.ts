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
  visit_source: string;
  entry_path: string;
  browser: BrowserVisitContext;
};

type BrowserVisitContext = {
  timezone: string;
  timezone_area: string;
  timezone_city: string;
  locale: string;
  country_hint: string;
  languages: string[];
  user_agent: string;
  platform: string;
  vendor: string;
  app_name: string;
  app_code_name: string;
  app_version: string;
  product: string;
  product_sub: string;
  cookie_enabled: boolean;
  do_not_track: string;
  hardware_concurrency: string;
  device_memory: string;
  max_touch_points: string;
  pdf_viewer_enabled: boolean | string;
  webdriver: boolean;
  online: boolean;
  screen: string;
  screen_details: Record<string, string>;
  viewport: string;
  window_details: Record<string, string>;
  connection: Record<string, string | boolean>;
  device_pixel_ratio: string;
  referrer: string;
};

@Injectable({ providedIn: 'root' })
export class VisitLoggingService {
  private readonly router = inject(Router);
  private readonly visitId = this.createVisitId();
  private readonly visitAttribution = this.readVisitAttribution();
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
      visit_source: this.visitAttribution.visitSource,
      entry_path: this.visitAttribution.entryPath,
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

  private readVisitAttribution(): { visitSource: string; entryPath: string } {
    const currentUrl = new URL(window.location.href);
    const source = currentUrl.searchParams.get('source') ?? currentUrl.searchParams.get('utm_source') ?? '';
    const entryPath = currentUrl.searchParams.get('entry') ?? '';
    const isResumeApiEntry = source === 'resume' || entryPath === '/api';
    const storedSource = window.sessionStorage.getItem('agent-systems-visit-source') ?? '';
    const storedEntryPath = window.sessionStorage.getItem('agent-systems-entry-path') ?? '';

    if (isResumeApiEntry) {
      window.sessionStorage.setItem('agent-systems-visit-source', 'resume');
      window.sessionStorage.setItem('agent-systems-entry-path', entryPath || '/api');
      return { visitSource: 'resume', entryPath: entryPath || '/api' };
    }

    return {
      visitSource: storedSource,
      entryPath: storedEntryPath,
    };
  }

  private readBrowserContext(): BrowserVisitContext {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
    const locale = navigator.language ?? '';
    const timezoneParts = timezone.split('/');
    const navigatorWithOptionalFields = navigator as Navigator & {
      connection?: {
        effectiveType?: string;
        downlink?: number;
        rtt?: number;
        saveData?: boolean;
      };
      deviceMemory?: number;
      pdfViewerEnabled?: boolean;
    };

    return {
      timezone,
      timezone_area: timezoneParts[0] ?? '',
      timezone_city: this.normalizeTimezoneCity(timezoneParts.slice(1).join('/')),
      locale,
      country_hint: this.readCountryHint(locale),
      languages: Array.from(navigator.languages ?? []),
      user_agent: navigator.userAgent ?? '',
      platform: navigator.platform ?? '',
      vendor: navigator.vendor ?? '',
      app_name: navigator.appName ?? '',
      app_code_name: navigator.appCodeName ?? '',
      app_version: navigator.appVersion ?? '',
      product: navigator.product ?? '',
      product_sub: navigator.productSub ?? '',
      cookie_enabled: navigator.cookieEnabled,
      do_not_track: navigator.doNotTrack ?? '',
      hardware_concurrency: this.stringifyBrowserValue(navigator.hardwareConcurrency),
      device_memory: this.stringifyBrowserValue(navigatorWithOptionalFields.deviceMemory),
      max_touch_points: this.stringifyBrowserValue(navigator.maxTouchPoints),
      pdf_viewer_enabled: navigatorWithOptionalFields.pdfViewerEnabled ?? '',
      webdriver: navigator.webdriver,
      online: navigator.onLine,
      screen: `${window.screen.width}x${window.screen.height}`,
      screen_details: {
        width: this.stringifyBrowserValue(window.screen.width),
        height: this.stringifyBrowserValue(window.screen.height),
        avail_width: this.stringifyBrowserValue(window.screen.availWidth),
        avail_height: this.stringifyBrowserValue(window.screen.availHeight),
        color_depth: this.stringifyBrowserValue(window.screen.colorDepth),
        pixel_depth: this.stringifyBrowserValue(window.screen.pixelDepth),
      },
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      window_details: {
        inner_width: this.stringifyBrowserValue(window.innerWidth),
        inner_height: this.stringifyBrowserValue(window.innerHeight),
        outer_width: this.stringifyBrowserValue(window.outerWidth),
        outer_height: this.stringifyBrowserValue(window.outerHeight),
      },
      connection: {
        effective_type: navigatorWithOptionalFields.connection?.effectiveType ?? '',
        downlink: this.stringifyBrowserValue(navigatorWithOptionalFields.connection?.downlink),
        rtt: this.stringifyBrowserValue(navigatorWithOptionalFields.connection?.rtt),
        save_data: navigatorWithOptionalFields.connection?.saveData ?? false,
      },
      device_pixel_ratio: this.stringifyBrowserValue(window.devicePixelRatio),
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

  private stringifyBrowserValue(value: unknown): string {
    if (value === undefined || value === null) {
      return '';
    }
    return String(value);
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
