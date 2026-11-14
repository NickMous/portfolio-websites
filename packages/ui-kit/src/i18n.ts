import { checkParity, createI18n, type DomainMap } from '@nickmous/astro-i18n';
import uiEn from './i18n/en';
import uiNl from './i18n/nl';
import { getLocale } from './locale';
import type { Locale } from './sites';

type Shared = typeof uiEn;

interface SiteI18nOptions<Strings extends DomainMap> {
  en: Strings;
  /** Must have exactly the same keys as `en` (checked by TypeScript and at build start). */
  nl: NoInfer<Strings>;
  /** Defaults to the build locale from LOCALE. */
  locale?: Locale;
}

/**
 * Set up translations for a site: the site's own domains plus the shared
 * ui-kit domains (`ui`, `badges`). English defines the keys; a typo is a type
 * error, and a key missing in Dutch fails the build.
 */
export function createSiteI18n<Strings extends DomainMap>(options: SiteI18nOptions<Strings>) {
  const languages = {
    en: { ...uiEn, ...options.en },
    nl: { ...uiNl, ...options.nl },
  } as { en: Shared & Strings; nl: Shared & Strings };

  const issues = checkParity(languages, 'en').filter((i) => i.missing.length || i.extra.length);
  if (issues.length) {
    const details = issues
      .map((i) => `${i.language}: missing [${i.missing.join(', ')}] extra [${i.extra.join(', ')}]`)
      .join('\n');
    throw new Error(`Translations are out of sync with English:\n${details}`);
  }

  const i18n = createI18n({
    languages,
    defaultLanguage: 'en',
    languageNames: { en: 'English', nl: 'Nederlands' },
    onMissing: 'throw',
  });
  const locale = options.locale ?? getLocale();

  return {
    locale,
    i18n,
    /** Translator for one domain in the build locale: `t('hero')('title')`. */
    t: <D extends Extract<keyof (Shared & Strings), string>>(domain: D) =>
      i18n.useTranslations(locale, domain),
    /** Structured (non-string) data for one domain in the build locale. */
    data: <D extends Extract<keyof (Shared & Strings), string>>(domain: D) =>
      i18n.getTranslationData(locale, domain),
  };
}
