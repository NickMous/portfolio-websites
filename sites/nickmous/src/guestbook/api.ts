import { apiBase, type Fetch } from '../apiBase';

/** Same limits as the API (api/src/Guestbook/NewGuestbookEntry.php). */
export const MAX_NAME = 40;
export const MAX_MESSAGE = 500;

export interface Entry {
  name: string;
  message: string;
  createdAt: string;
}

export interface NewEntry {
  name: string;
  message: string;
  /** Honeypot: hidden from people, so only bots fill it in. */
  website: string;
}

export type FieldError =
  | 'nameMissing'
  | 'nameTooLong'
  | 'nameInvalid'
  | 'messageMissing'
  | 'messageTooLong'
  | 'messageInvalid';

export interface FieldErrors {
  name?: FieldError;
  message?: FieldError;
}

export type SubmitResult =
  | { kind: 'sent' }
  | { kind: 'invalid'; errors: FieldErrors }
  | { kind: 'tooMany' }
  | { kind: 'failed' };

/** Checks what the API would reject, before sending. */
export function validate({ name, message }: { name: string; message: string }): FieldErrors {
  const errors: FieldErrors = {};
  const n = name.trim();
  const m = message.trim();
  if (n === '') errors.name = 'nameMissing';
  else if (n.length > MAX_NAME) errors.name = 'nameTooLong';
  if (m === '') errors.message = 'messageMissing';
  else if (m.length > MAX_MESSAGE) errors.message = 'messageTooLong';
  return errors;
}

export async function submitEntry(
  base: string = apiBase,
  entry: NewEntry,
  fetchImpl: Fetch = fetch,
): Promise<SubmitResult> {
  try {
    const response = await fetchImpl(`${base}/api/guestbook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/ld+json', Accept: 'application/ld+json' },
      body: JSON.stringify(entry),
    });
    if (response.status === 202) return { kind: 'sent' };
    if (response.status === 429) return { kind: 'tooMany' };
    if (response.status === 422) {
      const body = (await response.json()) as { violations?: { propertyPath: string }[] };
      const errors: FieldErrors = {};
      for (const { propertyPath } of body.violations ?? []) {
        if (propertyPath === 'name') errors.name = 'nameInvalid';
        if (propertyPath === 'message') errors.message = 'messageInvalid';
      }
      return { kind: 'invalid', errors };
    }
    return { kind: 'failed' };
  } catch {
    return { kind: 'failed' };
  }
}

/** The first page of approved entries, newest first; null if unreachable. */
export async function fetchEntries(
  base: string = apiBase,
  fetchImpl: Fetch = fetch,
): Promise<Entry[] | null> {
  try {
    const response = await fetchImpl(`${base}/api/guestbook`, {
      headers: { Accept: 'application/ld+json' },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { member: Entry[] };
    return body.member;
  } catch {
    return null;
  }
}
