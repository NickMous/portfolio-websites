import { siteUrl, type Locale, type SiteKey } from './sites';

export const locales = ['en', 'nl'] as const satisfies readonly Locale[];

/**
 * Each site is built once per locale (LOCALE=en for .com, LOCALE=nl for .nl).
 * Unset means English; anything else unknown fails the build.
 */
export function parseLocale(value: string | undefined): Locale {
  if (!value) return 'en';
  if ((locales as readonly string[]).includes(value)) return value as Locale;
  throw new Error(`Unknown LOCALE "${value}". Use one of: ${locales.join(', ')}.`);
}

/** The locale of the current build, from the LOCALE environment variable. */
export function getLocale(): Locale {
  return parseLocale(process.env.LOCALE);
}

export function otherLocale(locale: Locale): Locale {
  return locale === 'en' ? 'nl' : 'en';
}

/** Same path on the other language's domain (EN/NL switch, hreflang). */
export function alternateUrl(site: SiteKey, locale: Locale, path: string): string {
  return siteUrl(site, otherLocale(locale), path);
}
