import { describe, expect, it } from 'vitest';
import { createSiteI18n } from './i18n';

describe('createSiteI18n', () => {
  it('fails when a Dutch translation is missing', () => {
    expect(() =>
      createSiteI18n({
        locale: 'nl',
        en: { hero: { title: 'Hi', intro: 'Intro' } },
        // @ts-expect-error: missing keys are a type error too
        nl: { hero: { title: 'Hoi' } },
      }),
    ).toThrow(/nl.*hero\.intro/s);
  });

  it('translates site and shared ui-kit strings in the build locale', () => {
    const { t } = createSiteI18n({
      locale: 'nl',
      en: { hero: { title: 'Hi' } },
      nl: { hero: { title: 'Hoi' } },
    });
    expect(t('hero')('title')).toBe('Hoi');
    expect(t('badges')('inTesting')).toBe('In testfase');
  });
});
