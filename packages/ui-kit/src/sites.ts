export type Locale = 'en' | 'nl';
export type PosterColor = 'yellow' | 'blue' | 'red' | 'green';

export interface SiteInfo {
  /** Lowercase wordmark, also the domain name. */
  name: string;
  lead: PosterColor;
  /** Background color of the site footer. */
  footer: PosterColor;
  domains: Record<Locale, string>;
}

export const sites = {
  webenjoyer: {
    name: 'webenjoyer',
    lead: 'blue',
    footer: 'yellow',
    domains: { en: 'webenjoyer.com', nl: 'webenjoyer.nl' },
  },
  nickmous: {
    name: 'nickmous',
    lead: 'yellow',
    footer: 'blue',
    domains: { en: 'nickmous.com', nl: 'nickmous.nl' },
  },
  imlostincode: {
    name: 'imlostincode',
    lead: 'red',
    footer: 'green',
    domains: { en: 'imlostincode.com', nl: 'imlostincode.nl' },
  },
  sanderdh: {
    name: 'sanderdh',
    lead: 'green',
    footer: 'green',
    domains: { en: 'sanderdh.com', nl: 'sanderdh.nl' },
  },
} as const satisfies Record<string, SiteInfo>;

export type SiteKey = keyof typeof sites;

/** Absolute URL on a site's domain for the given locale (.com = en, .nl = nl). */
export function siteUrl(site: SiteKey, locale: Locale, path = '/'): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `https://${sites[site].domains[locale]}${cleanPath}`;
}

/** The other three sites, in registry order (used for footer links). */
export function otherSites(site: SiteKey): SiteKey[] {
  return (Object.keys(sites) as SiteKey[]).filter((key) => key !== site);
}
