/** Size of the favicon's square, in SVG units. */
export const FAVICON_BOX = 64;

/** One square in the site's lead color with the letter drawn as a path. */
export function faviconSvg({
  path,
  background,
  color,
}: {
  path: string;
  background: string;
  color: string;
}): string {
  const b = FAVICON_BOX;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${b} ${b}">` +
    `<rect width="${b}" height="${b}" fill="${background}"/>` +
    `<path d="${path}" fill="${color}"/>` +
    `</svg>\n`
  );
}

/**
 * An .ico holding PNG images (supported everywhere since Windows Vista):
 * a 6-byte header, a 16-byte entry per image, then the PNGs themselves.
 */
export function encodeIco(images: { size: number; png: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const entries = images.map(({ size, png }) => {
    const entry = Buffer.alloc(16);
    // A width or height of 256 is stored as 0.
    entry.writeUInt8(size % 256, 0);
    entry.writeUInt8(size % 256, 1);
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...images.map((i) => i.png)]);
}
