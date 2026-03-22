/**
 * Font loading and caching for pdf-lib template filling.
 * Loads TTF font files via fetch() and caches them in memory.
 */

const fontCache = new Map<string, ArrayBuffer>();

async function loadFont(url: string): Promise<ArrayBuffer> {
  const cached = fontCache.get(url);
  if (cached) return cached;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load font: ${url} (${response.status})`);
  }
  const buffer = await response.arrayBuffer();
  fontCache.set(url, buffer);
  return buffer;
}

export interface FontUrls {
  regular: string;
  bold: string;
  italic: string;
  boldItalic: string;
}

export interface FontBuffers {
  regular: ArrayBuffer;
  bold: ArrayBuffer;
  italic: ArrayBuffer;
  boldItalic: ArrayBuffer;
}

export function getFontUrls(baseUrl: string): FontUrls {
  return {
    regular: `${baseUrl}/fonts/liberation-serif-regular.ttf`,
    bold: `${baseUrl}/fonts/liberation-serif-bold.ttf`,
    italic: `${baseUrl}/fonts/liberation-serif-italic.ttf`,
    boldItalic: `${baseUrl}/fonts/liberation-serif-bold-italic.ttf`,
  };
}

export async function loadAllFonts(baseUrl: string): Promise<FontBuffers> {
  const urls = getFontUrls(baseUrl);
  const [regular, bold, italic, boldItalic] = await Promise.all([
    loadFont(urls.regular),
    loadFont(urls.bold),
    loadFont(urls.italic),
    loadFont(urls.boldItalic),
  ]);
  return { regular, bold, italic, boldItalic };
}

export function clearFontCache(): void {
  fontCache.clear();
}
