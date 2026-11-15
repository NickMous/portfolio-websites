import { sites, type SiteKey } from './sites';

/** Umami (self-hosted). Website ids are public: they end up in every page anyway. */
const UMAMI_HOST = 'https://analytics.nickmous.nl';

const websiteIds: Record<SiteKey, string> = {
  sanderdh: '1d3cf00f-59f5-42e7-aea7-fa195353efd4',
  webenjoyer: 'f991c7f1-1605-4c40-895b-2ae026388f64',
  imlostincode: '4dfe0edf-bae8-4f39-aad9-0bad06cd9aef',
  nickmous: 'c7314395-7484-40cc-ab63-59f10b1b20a3',
};

export interface UmamiConfig {
  websiteId: string;
  /** Both locale domains: one Umami website per site, split by hostname. */
  domains: string[];
}

export function umamiConfig(site: SiteKey): UmamiConfig {
  return { websiteId: websiteIds[site], domains: Object.values(sites[site].domains) };
}

/**
 * Adds Umami's tracker and session recorder, but only on the site's own
 * domains. The tracker honours data-domains by itself; the recorder does not,
 * so without this check localhost and preview builds would be recorded.
 */
export function loadUmami(doc: Document, hostname: string, config: UmamiConfig): void {
  if (!config.domains.includes(hostname)) return;
  for (const file of ['script.js', 'recorder.js']) {
    const script = doc.createElement('script');
    script.defer = true;
    script.src = `${UMAMI_HOST}/${file}`;
    script.dataset.websiteId = config.websiteId;
    script.dataset.domains = config.domains.join(',');
    doc.head.append(script);
  }
}

declare global {
  interface Window {
    /** Set by Umami's tracker; missing when it's blocked or on another domain. */
    umami?: { track: (event: string, data?: Record<string, string>) => unknown };
  }
}

/** Sends a custom event. A blocked or missing tracker is fine: nothing happens. */
export function track(event: string, data?: Record<string, string>): void {
  try {
    window.umami?.track(event, data);
  } catch {
    // Analytics must never break the page.
  }
}

/**
 * Tracks clicks on links that leave the site as `outbound-link`. Links with
 * their own `data-umami-event` (doors, language switch, email) are left to
 * Umami, so a click is never counted twice.
 */
export function trackOutboundLinks(doc: Document, hostname: string): void {
  doc.addEventListener(
    'click',
    (event) => {
      const link = (event.target as Element | null)?.closest?.('a[href]');
      if (!(link instanceof HTMLAnchorElement) || link.closest('[data-umami-event]')) return;
      if (!/^https?:$/.test(link.protocol) || link.hostname === hostname) return;
      track('outbound-link', { url: link.href });
    },
    { capture: true },
  );
}
