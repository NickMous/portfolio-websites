/**
 * The nickmous API (api/ in this repo). Set PUBLIC_API_URL to point a build
 * or `npm run dev` at another one, e.g. a local API on http://localhost:8000.
 */
export const apiBase: string = import.meta.env.PUBLIC_API_URL ?? 'https://api.nickmous.com';

export type Fetch = (url: string, init?: RequestInit) => Promise<Response>;
