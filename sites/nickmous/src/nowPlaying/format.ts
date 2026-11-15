import type { Locale } from '@portfolio/ui-kit';

const DAY = 24 * 60 * 60 * 1000;

/** Whole calendar days (UTC) between a date and now. */
function daysAgo(date: string, now: Date): number {
  const then = new Date(date);
  const day = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.max(0, Math.round((day(now) - day(then)) / DAY));
}

/** "today", "yesterday", "3 days ago", "2 months ago" (or the Dutch equivalents). */
export function lastPlayed(date: string, now: Date, locale: Locale): string {
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const days = daysAgo(date, now);
  if (days < 30) return format.format(-days, 'day');
  if (days < 365) return format.format(-Math.floor(days / 30), 'month');
  return format.format(-Math.floor(days / 365), 'year');
}

/** 12.6 → "12.6" (en) or "12,6" (nl). */
export function number(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value);
}

/** Picks the singular or plural template and fills in {n}. */
export function plural(
  count: number,
  templates: { one: string; other: string },
  locale: Locale,
): string {
  const form = new Intl.PluralRules(locale).select(count) === 'one' ? 'one' : 'other';
  return templates[form].replace('{n}', number(count, locale));
}
