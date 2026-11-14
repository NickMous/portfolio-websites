import { describe, expect, it } from 'vitest';
import { alternateUrl, parseLocale } from './locale';

describe('parseLocale', () => {
  it('defaults to English when LOCALE is not set', () => {
    expect(parseLocale(undefined)).toBe('en');
    expect(parseLocale('')).toBe('en');
  });

  it('rejects unknown locales instead of silently building English', () => {
    expect(() => parseLocale('NL')).toThrow(/LOCALE/);
    expect(() => parseLocale('de')).toThrow(/LOCALE/);
  });
});

describe('alternateUrl', () => {
  it('points to the same path on the other language domain', () => {
    expect(alternateUrl('webenjoyer', 'en', '/work/oktoberfest')).toBe(
      'https://webenjoyer.nl/work/oktoberfest',
    );
    expect(alternateUrl('webenjoyer', 'nl', '/')).toBe('https://webenjoyer.com/');
  });
});
