import { describe, expect, it } from 'vitest';
import { encodeIco, faviconSvg } from './favicon';

describe('encodeIco', () => {
  it('wraps PNGs in an ICO directory, one entry per size', () => {
    const png16 = Buffer.from('png-16');
    const png48 = Buffer.from('png-of-48');
    const ico = encodeIco([
      { size: 16, png: png16 },
      { size: 48, png: png48 },
    ]);

    // ICONDIR: reserved 0, type 1 (icon), 2 images.
    expect([ico.readUInt16LE(0), ico.readUInt16LE(2), ico.readUInt16LE(4)]).toEqual([0, 1, 2]);

    const entry = (i: number) => {
      const at = 6 + i * 16;
      return {
        width: ico.readUInt8(at),
        height: ico.readUInt8(at + 1),
        planes: ico.readUInt16LE(at + 4),
        bpp: ico.readUInt16LE(at + 6),
        bytes: ico.readUInt32LE(at + 8),
        offset: ico.readUInt32LE(at + 12),
      };
    };
    const first = entry(0);
    const second = entry(1);
    expect(first).toEqual({ width: 16, height: 16, planes: 1, bpp: 32, bytes: 6, offset: 38 });
    expect(second).toEqual({ width: 48, height: 48, planes: 1, bpp: 32, bytes: 9, offset: 44 });
    expect(ico.subarray(first.offset, first.offset + first.bytes)).toEqual(png16);
    expect(ico.subarray(second.offset)).toEqual(png48);
  });

  it('writes 256 as 0, as the format requires', () => {
    const ico = encodeIco([{ size: 256, png: Buffer.from('x') }]);
    expect([ico.readUInt8(6), ico.readUInt8(7)]).toEqual([0, 0]);
  });
});

describe('faviconSvg', () => {
  it('is a square with the letter as a path, so it needs no font', () => {
    const svg = faviconSvg({ path: 'M1 2L3 4Z', background: '#f2b705', color: '#141414' });
    expect(svg).toContain('viewBox="0 0 64 64"');
    expect(svg).toContain('<rect width="64" height="64" fill="#f2b705"/>');
    expect(svg).toContain('<path d="M1 2L3 4Z" fill="#141414"/>');
    expect(svg).not.toContain('<text');
  });
});
