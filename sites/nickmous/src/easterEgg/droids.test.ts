// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { showDroids } from './droids';

const strings = { label: 'Nyan droids', close: 'Close' };

const reducedMotion = (reduce: boolean) =>
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('reduced-motion') ? reduce : false,
  }));

const escape = () =>
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

beforeEach(() => {
  document.body.innerHTML = '<button id="before">Before</button>';
  document.getElementById('before')?.focus();
});
afterEach(() => {
  escape();
  vi.unstubAllGlobals();
});

it('opens a labelled dialog with focus on its close button, and locks scrolling', () => {
  reducedMotion(true);
  showDroids(strings);

  const dialog = document.querySelector('[role="dialog"]');
  expect(dialog?.getAttribute('aria-label')).toBe('Nyan droids');
  expect(dialog?.getAttribute('aria-modal')).toBe('true');
  expect(document.activeElement?.textContent).toBe('Close');
  expect(document.documentElement.style.overflow).toBe('hidden');
});

it('closes on Escape and gives focus back', () => {
  reducedMotion(true);
  showDroids(strings);

  escape();

  expect(document.querySelector('[role="dialog"]')).toBeNull();
  expect(document.activeElement?.id).toBe('before');
  expect(document.documentElement.style.overflow).toBe('');
});

it('closes with the close button', () => {
  reducedMotion(true);
  showDroids(strings);

  (document.activeElement as HTMLButtonElement).click();

  expect(document.querySelector('[role="dialog"]')).toBeNull();
});

it('shows a still picture when reduced motion is asked for', () => {
  reducedMotion(true);
  const animate = vi.spyOn(HTMLElement.prototype, 'animate');
  showDroids(strings);

  const sky = document.querySelector('.easter-sky');
  expect(sky?.classList.contains('easter-still')).toBe(true);
  expect(sky?.querySelectorAll('.easter-droid').length).toBeGreaterThan(0);
  expect(animate).not.toHaveBeenCalled();
});

it('only opens once at a time', () => {
  reducedMotion(true);
  showDroids(strings);
  showDroids(strings);

  expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(1);
});
