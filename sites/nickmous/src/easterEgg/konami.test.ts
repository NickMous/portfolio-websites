// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { listenForKonami } from './konami';

const CODE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
];

const press = (keys: string[], target: EventTarget = document.body) => {
  for (const key of keys) {
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  }
};

const swipe = (dx: number, dy: number) => {
  const touch = (x: number, y: number) => [{ clientX: x, clientY: y }] as unknown as TouchList;
  document.dispatchEvent(
    Object.assign(new Event('touchstart'), { changedTouches: touch(200, 200) }),
  );
  document.dispatchEvent(
    Object.assign(new Event('touchend'), { changedTouches: touch(200 + dx, 200 + dy) }),
  );
};

let stop: (() => void) | undefined;
afterEach(() => {
  stop?.();
  document.body.innerHTML = '';
});

describe('listenForKonami', () => {
  it('fires on ↑↑↓↓←→←→BA', () => {
    const found = vi.fn();
    stop = listenForKonami(found);

    press(CODE);

    expect(found).toHaveBeenCalledOnce();
  });

  it('accepts a capital B and A', () => {
    const found = vi.fn();
    stop = listenForKonami(found);

    press([...CODE.slice(0, 8), 'B', 'A']);

    expect(found).toHaveBeenCalledOnce();
  });

  it('still fires after a false start', () => {
    const found = vi.fn();
    stop = listenForKonami(found);

    press(['ArrowUp', 'ArrowUp', 'ArrowUp', ...CODE.slice(2)]);
    press(['x', ...CODE]);

    expect(found).toHaveBeenCalledTimes(2);
  });

  it('ignores a wrong key in the middle', () => {
    const found = vi.fn();
    stop = listenForKonami(found);

    press([...CODE.slice(0, 5), 'x', ...CODE.slice(5)]);

    expect(found).not.toHaveBeenCalled();
  });

  it('ignores typing in form fields, like the guestbook', () => {
    const found = vi.fn();
    stop = listenForKonami(found);
    const field = document.createElement('textarea');
    document.body.append(field);

    press(CODE, field);

    expect(found).not.toHaveBeenCalled();
  });

  it('works with swipes and two taps on a touch screen', () => {
    const found = vi.fn();
    stop = listenForKonami(found);

    for (const [dx, dy] of [
      [0, -100],
      [0, -100],
      [0, 100],
      [0, 100],
      [-100, 0],
      [100, 0],
      [-100, 0],
      [100, 0],
      [0, 0],
      [0, 0],
    ] as const) {
      swipe(dx, dy);
    }

    expect(found).toHaveBeenCalledOnce();
  });

  it('stops listening when asked', () => {
    const found = vi.fn();
    listenForKonami(found)();

    press(CODE);

    expect(found).not.toHaveBeenCalled();
  });
});
