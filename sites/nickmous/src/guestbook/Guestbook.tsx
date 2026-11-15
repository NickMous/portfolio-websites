import { track } from '@portfolio/ui-kit/analytics';
import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import {
  fetchEntries,
  MAX_NAME,
  submitEntry,
  validate,
  type Entry,
  type FieldError,
  type FieldErrors,
} from './api';

export interface GuestbookStrings {
  name: string;
  message: string;
  submit: string;
  sending: string;
  sent: string;
  tooMany: string;
  failed: string;
  errors: Record<FieldError, string>;
  entriesLabel: string;
  empty: string;
  honeypot: string;
}

interface Props {
  /** Fetched at build time; null when the API couldn't be reached. */
  initial: Entry[] | null;
  apiBase: string;
  strings: GuestbookStrings;
  /** Heading and intro, shown above the form. */
  children?: ComponentChildren;
}

type Status = 'idle' | 'sending' | 'sent' | 'tooMany' | 'failed';

// Notes pinned slightly crooked, like the design.
const notes = [
  'bg-white rotate-[-0.8deg]',
  'bg-yellow rotate-[0.6deg]',
  'bg-white rotate-[-0.4deg]',
  'bg-blue-tint rotate-[0.9deg]',
];
const SHOWN = 6;

const fieldClass =
  'min-h-11 border-3 border-ink bg-white px-3.5 py-3 font-sans text-[17px] text-ink aria-invalid:outline-3 aria-invalid:outline-offset-2 aria-invalid:outline-yellow';

/** "Leave a mark": the guestbook form and the latest approved notes. */
export default function Guestbook({ initial, apiBase, strings, children }: Props) {
  const [entries, setEntries] = useState(initial);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>('idle');
  const nameField = useRef<HTMLInputElement>(null);
  const messageField = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    void fetchEntries(apiBase).then((fresh) => fresh && setEntries(fresh));
  }, [apiBase]);

  async function submit(event: Event) {
    event.preventDefault();
    const found = validate({ name, message });
    setErrors(found);
    if (found.name || found.message) {
      track('guestbook-submit', { result: 'invalid' });
      (found.name ? nameField : messageField).current?.focus();
      return;
    }

    setStatus('sending');
    const result = await submitEntry(apiBase, {
      name: name.trim(),
      message: message.trim(),
      website,
    });
    // Only the outcome, never what was written.
    track('guestbook-submit', { result: result.kind });
    if (result.kind === 'invalid') {
      setStatus('idle');
      setErrors(result.errors);
      (result.errors.name ? nameField : messageField).current?.focus();
      return;
    }
    if (result.kind === 'sent') {
      setName('');
      setMessage('');
    }
    setStatus(result.kind);
  }

  const statusText =
    status === 'sent'
      ? strings.sent
      : status === 'tooMany'
        ? strings.tooMany
        : status === 'failed'
          ? strings.failed
          : '';

  return (
    <div class="flex flex-wrap gap-12 max-sm:gap-10">
      <div class="flex flex-[1_1_380px] flex-col gap-5">
        {children}
        <form noValidate onSubmit={submit} class="flex flex-col gap-3.5">
          <label class="flex flex-col gap-1.5 text-[14px] font-bold">
            {strings.name}
            <input
              ref={nameField}
              type="text"
              name="name"
              autoComplete="name"
              maxLength={MAX_NAME}
              value={name}
              onInput={(e) => setName(e.currentTarget.value)}
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={errors.name ? 'guestbook-name-error' : undefined}
              class={fieldClass}
            />
          </label>
          {errors.name && (
            <p id="guestbook-name-error" class="-mt-1.5 text-[15px] font-bold">
              {strings.errors[errors.name]}
            </p>
          )}

          <label class="flex flex-col gap-1.5 text-[14px] font-bold">
            {strings.message}
            <textarea
              ref={messageField}
              name="message"
              rows={3}
              value={message}
              onInput={(e) => setMessage(e.currentTarget.value)}
              aria-invalid={errors.message ? true : undefined}
              aria-describedby={errors.message ? 'guestbook-message-error' : undefined}
              class={`${fieldClass} resize-y`}
            />
          </label>
          {errors.message && (
            <p id="guestbook-message-error" class="-mt-1.5 text-[15px] font-bold">
              {strings.errors[errors.message]}
            </p>
          )}

          {/* Honeypot: off-screen and out of the tab order and accessibility tree. */}
          <div aria-hidden="true" class="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label>
              {strings.honeypot}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onInput={(e) => setWebsite(e.currentTarget.value)}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={status === 'sending'}
            class="min-h-11 self-start border-3 border-ink bg-yellow px-6 py-2.5 font-display text-[28px] font-black text-ink uppercase disabled:opacity-70"
          >
            {status === 'sending' ? strings.sending : strings.submit}
          </button>

          <p role="status" class="min-h-[1.5em] text-[17px] font-bold">
            {statusText}
          </p>
        </form>
      </div>

      <div class="flex-[1_1_420px]">
        {entries && entries.length > 0 ? (
          <ul aria-label={strings.entriesLabel} class="flex flex-col gap-4">
            {entries.slice(0, SHOWN).map((entry, i) => (
              <li class={`flex flex-col gap-2 px-5 py-[18px] text-ink ${notes[i % notes.length]}`}>
                <p class="text-[17px] leading-normal wrap-break-word whitespace-pre-line">
                  {entry.message}
                </p>
                <span class="text-[14px] font-bold">— {entry.name}</span>
              </li>
            ))}
          </ul>
        ) : (
          entries && <p class="text-[17px]">{strings.empty}</p>
        )}
      </div>
    </div>
  );
}
