import { describe, expect, it } from 'vitest';
import { fetchEntries, submitEntry, validate } from './api';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('validate', () => {
  it('accepts a name and message within the limits', () => {
    expect(validate({ name: ' Ada ', message: 'Hi' })).toEqual({});
    expect(validate({ name: 'a'.repeat(40), message: 'a'.repeat(500) })).toEqual({});
  });

  it('mirrors the API rules: required after trimming, 40 and 500 characters', () => {
    expect(validate({ name: '   ', message: '' })).toEqual({
      name: 'nameMissing',
      message: 'messageMissing',
    });
    expect(validate({ name: 'a'.repeat(41), message: 'a'.repeat(501) })).toEqual({
      name: 'nameTooLong',
      message: 'messageTooLong',
    });
  });
});

describe('submitEntry', () => {
  const entry = { name: 'Ada', message: 'Hi', website: '' };

  it('posts the entry, honeypot included, and reports it as sent', async () => {
    let sent: { url: string; init: RequestInit | undefined } | undefined;
    const result = await submitEntry('https://api.example', entry, async (url, init) => {
      sent = { url, init };
      return new Response(null, { status: 202 });
    });

    expect(result).toEqual({ kind: 'sent' });
    expect(sent?.url).toBe('https://api.example/api/guestbook');
    expect(sent?.init?.method).toBe('POST');
    expect(JSON.parse(String(sent?.init?.body))).toEqual(entry);
  });

  it('maps the API validation errors onto the fields', async () => {
    const result = await submitEntry('https://api.example', entry, async () =>
      json({ violations: [{ propertyPath: 'message', message: 'This value is too long.' }] }, 422),
    );

    expect(result).toEqual({ kind: 'invalid', errors: { message: 'messageInvalid' } });
  });

  it('says when the visitor is rate limited', async () => {
    const result = await submitEntry('https://api.example', entry, async () => json({}, 429));
    expect(result).toEqual({ kind: 'tooMany' });
  });

  it.each([
    ['a server error', async () => json({}, 500)],
    [
      'no connection',
      async () => {
        throw new TypeError('fetch failed');
      },
    ],
  ])('reports %s as failed', async (_, fetchImpl) => {
    expect(await submitEntry('https://api.example', entry, fetchImpl)).toEqual({ kind: 'failed' });
  });
});

describe('fetchEntries', () => {
  it('returns the approved entries', async () => {
    const entries = await fetchEntries('https://api.example', async () =>
      json({ member: [{ name: 'Ada', message: 'Hi', createdAt: '2026-11-01T10:00:00+00:00' }] }),
    );
    expect(entries).toEqual([
      { name: 'Ada', message: 'Hi', createdAt: '2026-11-01T10:00:00+00:00' },
    ]);
  });

  it('returns null when the API cannot be reached', async () => {
    expect(await fetchEntries('https://api.example', async () => json({}, 503))).toBeNull();
  });
});
