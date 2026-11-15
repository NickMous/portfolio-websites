import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { palette } from './palette';

it('matches theme.css', () => {
  const theme = readFileSync(new URL('./styles/theme.css', import.meta.url), 'utf8');
  for (const [name, value] of Object.entries(palette)) {
    expect(theme).toContain(`--color-${name}: ${value};`);
  }
});
