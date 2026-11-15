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
