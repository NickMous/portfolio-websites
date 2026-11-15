import { describe, expect, it } from 'vitest';
import { apiError, resolveToken } from './github';

describe('resolveToken', () => {
  it('prefers GITHUB_TOKEN', () => {
    expect(resolveToken({ GITHUB_TOKEN: 'from-env' }, () => 'from-gh')).toBe('from-env');
  });

  it('falls back to the gh CLI login', () => {
    expect(resolveToken({}, () => 'from-gh\n')).toBe('from-gh');
  });

  it('goes without a token when gh is missing or logged out', () => {
    const fail = () => {
      throw new Error('gh: command not found');
    };
    expect(resolveToken({}, fail)).toBeUndefined();
    expect(resolveToken({}, () => '')).toBeUndefined();
  });
});

describe('apiError', () => {
  it('explains a rate limit and how to lift it', () => {
    const message = apiError(
      403,
      'https://api.github.com/x',
      '{"message":"API rate limit exceeded"}',
      '0',
    );
    expect(message).toMatch(/rate limit/i);
    expect(message).toMatch(/gh auth login|GITHUB_TOKEN/);
  });

  it('passes other errors through', () => {
    expect(apiError(404, 'https://api.github.com/x', 'Not Found', '59')).toBe(
      'GitHub API 404 for https://api.github.com/x: Not Found',
    );
  });
});
