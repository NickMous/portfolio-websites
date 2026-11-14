import { describe, expect, it } from 'vitest';
import { otherSites, siteUrl } from './sites';

describe('siteUrl', () => {
  it('uses .com for English and .nl for Dutch', () => {
    expect(siteUrl('webenjoyer', 'en')).toBe('https://webenjoyer.com/');
    expect(siteUrl('webenjoyer', 'nl')).toBe('https://webenjoyer.nl/');
  });

  it('appends a path, with or without a leading slash', () => {
    expect(siteUrl('imlostincode', 'en', '/netstation')).toBe(
      'https://imlostincode.com/netstation',
    );
    expect(siteUrl('imlostincode', 'nl', 'netstation')).toBe('https://imlostincode.nl/netstation');
  });
});

describe('otherSites', () => {
  it('lists the other three sites in registry order', () => {
    expect(otherSites('webenjoyer')).toEqual(['nickmous', 'imlostincode', 'sanderdh']);
    expect(otherSites('sanderdh')).toEqual(['webenjoyer', 'nickmous', 'imlostincode']);
  });
});
