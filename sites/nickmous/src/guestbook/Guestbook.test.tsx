// @vitest-environment happy-dom
import { cleanup, render, screen, waitFor } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import Guestbook, { type GuestbookStrings } from './Guestbook';

const strings: GuestbookStrings = {
  name: 'Name',
  message: 'Message',
  submit: 'Sign it',
  sending: 'Signing…',
  sent: 'Thanks!',
  tooMany: 'Too many.',
  failed: 'Failed.',
  errors: {
    nameMissing: 'Fill in your name.',
    nameTooLong: 'Name too long.',
    nameInvalid: 'Name invalid.',
    messageMissing: 'Write a message.',
    messageTooLong: 'Message too long.',
    messageInvalid: 'Message invalid.',
  },
  entriesLabel: 'Notes from visitors',
  empty: 'No notes yet.',
  honeypot: 'Leave this empty',
};

const posted: unknown[] = [];

beforeEach(() => {
  posted.length = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        posted.push(JSON.parse(String(init.body)));
        return new Response(null, { status: 202 });
      }
      return new Response(JSON.stringify({ member: [] }), { status: 200 });
    }),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const show = () =>
  render(<Guestbook initial={[]} apiBase="https://api.example" strings={strings} />);

it('points out missing fields, linked to the inputs, and focuses the first one', async () => {
  show();
  await userEvent.click(screen.getByRole('button', { name: 'Sign it' }));

  const name = screen.getByRole('textbox', { name: 'Name' });
  expect(name.getAttribute('aria-invalid')).toBe('true');
  expect(name.getAttribute('aria-describedby')).toBe('guestbook-name-error');
  expect(document.getElementById('guestbook-name-error')?.textContent).toBe('Fill in your name.');
  expect(screen.getByText('Write a message.')).toBeTruthy();
  expect(document.activeElement).toBe(name);
  expect(posted).toEqual([]);
});

it('can be filled in and sent with the keyboard alone, and announces the result', async () => {
  show();
  const user = userEvent.setup();

  await user.tab();
  await user.keyboard('Ada');
  await user.tab();
  await user.keyboard('Nice site!');
  await user.tab(); // the honeypot is skipped
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Sign it' }));
  await user.keyboard('{Enter}');

  await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Thanks!'));
  expect(posted).toEqual([{ name: 'Ada', message: 'Nice site!', website: '' }]);
  expect((screen.getByRole('textbox', { name: 'Name' }) as HTMLInputElement).value).toBe('');
});

it('shows approved entries as notes', () => {
  render(
    <Guestbook
      initial={[{ name: 'Grace', message: 'Hi Sander!', createdAt: '2026-11-10T10:00:00+00:00' }]}
      apiBase="https://api.example"
      strings={strings}
    />,
  );

  const notes = screen.getByRole('list', { name: 'Notes from visitors' });
  expect(notes.textContent).toContain('Hi Sander!');
  expect(notes.textContent).toContain('— Grace');
});
