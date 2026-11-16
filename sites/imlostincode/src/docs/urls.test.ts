import { describe, expect, it } from 'vitest';
import { docsUrls, exampleLink, examplePath } from './urls';

describe('example URLs', () => {
  it('gives every example file its own page, keeping the folder path', () => {
    expect(docsUrls.example('kit', '1.2', 'overlay-ssr/kustomization.yaml')).toBe(
      '/kit/examples/1.2/overlay-ssr/kustomization.yaml/',
    );
  });

  it('drops leading dots, which the server refuses to serve', () => {
    expect(docsUrls.example('kit', '1.2', 'docker/.dockerignore')).toBe(
      '/kit/examples/1.2/docker/dockerignore/',
    );
    expect(examplePath('.github/workflows/ci.yaml')).toBe('github/workflows/ci.yaml');
  });

  it('links a file to its page and a folder to its group on the index', () => {
    const files = new Set(['docker/Dockerfile', 'README.md']);
    expect(exampleLink('kit', '1.2', 'docker/Dockerfile', files)).toBe(
      '/kit/examples/1.2/docker/Dockerfile/',
    );
    expect(exampleLink('kit', '1.2', 'docker', files)).toBe(
      `/kit/examples/1.2/#${docsUrls.exampleAnchor('docker')}`,
    );
    expect(exampleLink('kit', '1.2', '', files)).toBe('/kit/examples/1.2/');
  });
});
