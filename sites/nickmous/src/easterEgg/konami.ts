/**
 * Listens for the Konami code: ↑↑↓↓←→←→BA on a keyboard, or on a touch
 * screen the same arrows as swipes followed by two taps.
 */
const KEYS = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'b', 'a'];
const TOUCH = [...KEYS.slice(0, 8), 'tap', 'tap'];

const ARROWS: Record<string, string> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

const SWIPE = 30; // px before a touch counts as a swipe instead of a tap

function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  );
}

export type KonamiInput = 'keys' | 'touch';

/** Calls `found` every time the code is entered; returns a function that stops listening. */
export function listenForKonami(found: (input: KonamiInput) => void): () => void {
  let recent: string[] = [];

  const add = (token: string) => {
    recent = [...recent, token].slice(-KEYS.length);
    const matches = (code: string[]) => code.every((t, i) => recent[i] === t);
    if (recent.length < KEYS.length) return;
    const input = matches(KEYS) ? 'keys' : matches(TOUCH) ? 'touch' : undefined;
    if (input) {
      recent = [];
      found(input);
    }
  };

  const onKey = (event: KeyboardEvent) => {
    if (isTyping(event.target)) return;
    add(ARROWS[event.key] ?? event.key.toLowerCase());
  };

  let start: { x: number; y: number } | undefined;
  const onTouchStart = (event: TouchEvent) => {
    const touch = event.changedTouches[0];
    start = touch ? { x: touch.clientX, y: touch.clientY } : undefined;
  };
  const onTouchEnd = (event: TouchEvent) => {
    const touch = event.changedTouches[0];
    if (!start || !touch || isTyping(event.target)) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE) add('tap');
    else if (Math.abs(dx) > Math.abs(dy)) add(dx > 0 ? 'right' : 'left');
    else add(dy > 0 ? 'down' : 'up');
  };

  // Passive: watching gestures must never get in the way of scrolling.
  document.addEventListener('keydown', onKey);
  document.addEventListener('touchstart', onTouchStart, { passive: true });
  document.addEventListener('touchend', onTouchEnd, { passive: true });
  return () => {
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('touchstart', onTouchStart);
    document.removeEventListener('touchend', onTouchEnd);
  };
}
