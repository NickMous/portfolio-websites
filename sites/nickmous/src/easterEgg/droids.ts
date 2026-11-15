/**
 * The "nyan droids" from the old nickmous.com (NickMous/portfolio): pixel
 * droids of random sizes flying across a starry sky, the bigger the faster.
 * Same sprites, redrawn as PNG sprite sheets (12 droid and 6 star frames).
 */
export interface DroidStrings {
  label: string;
  close: string;
}

const random = (min: number, max: number) => min + Math.random() * (max - min);

function sprite(kind: 'droid' | 'star', height: number): HTMLSpanElement {
  const el = document.createElement('span');
  el.className = `easter-${kind}`;
  el.style.height = `${height}px`;
  return el;
}

let open = false;

export function showDroids(strings: DroidStrings): void {
  if (open) return;
  open = true;

  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = window.matchMedia('(max-width: 470px)').matches;
  const returnFocus = document.activeElement as HTMLElement | null;
  const overflow = document.documentElement.style.overflow;
  document.documentElement.style.overflow = 'hidden';

  const sky = document.createElement('div');
  sky.className = 'easter-sky';
  sky.setAttribute('role', 'dialog');
  sky.setAttribute('aria-modal', 'true');
  sky.setAttribute('aria-label', strings.label);
  if (still) sky.classList.add('easter-still');

  for (let i = 0; i < (small ? 30 : 50); i++) {
    const star = sprite('star', random(15, 50));
    star.style.top = `${random(0, 100)}%`;
    star.style.left = `${random(0, 100)}%`;
    star.style.animationDelay = `-${random(0, 2)}s`;
    sky.append(star);
  }

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'easter-close';
  close.textContent = strings.close;
  sky.append(close);

  let timer: ReturnType<typeof setTimeout> | undefined;
  const launch = () => {
    const height = random(15, 100);
    const droid = sprite('droid', height);
    droid.style.top = `${random(-5, 100)}%`;
    droid.style.zIndex = String(Math.round(height));
    sky.append(droid);
    // Speed from the original: bigger droids are closer, so they fly faster.
    const seconds = (small ? 100 : 200) / height;
    droid
      .animate([{ transform: 'translateX(100vw)' }, { transform: 'translateX(-150px)' }], {
        duration: seconds * 1000,
        easing: 'linear',
      })
      .finished.then(
        () => droid.remove(),
        () => droid.remove(),
      );
    timer = setTimeout(launch, small ? random(130, 300) : random(70, 200));
  };

  if (still) {
    // Reduced motion: a still picture instead of a flypast.
    for (let i = 0; i < 12; i++) {
      const droid = sprite('droid', random(20, 90));
      droid.style.top = `${random(0, 90)}%`;
      droid.style.left = `${random(0, 90)}%`;
      sky.append(droid);
    }
  } else {
    launch();
  }

  const dismiss = () => {
    clearTimeout(timer);
    document.removeEventListener('keydown', onKey, true);
    sky.remove();
    document.documentElement.style.overflow = overflow;
    returnFocus?.focus();
    open = false;
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      dismiss();
    } else if (event.key === 'Tab') {
      // The close button is the only thing to focus in here.
      event.preventDefault();
      close.focus();
    }
  };

  close.addEventListener('click', dismiss);
  document.addEventListener('keydown', onKey, true);
  document.body.append(sky);
  close.focus();
}
