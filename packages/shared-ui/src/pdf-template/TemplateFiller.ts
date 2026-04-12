/**
 * Core template filler: loads a government PDF template and stamps data onto it.
 * Uses pdf-lib for all PDF operations. Runs entirely client-side.
 */

import { PDFDocument, PDFFont, PDFPage, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type { FieldPosition, CheckboxPosition, ImagePosition, TextAlignment } from './types';

export interface FontSet {
  regular: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
  boldItalic: PDFFont;
}

export class TemplateFiller {
  private pdfDoc: PDFDocument;
  private fonts: FontSet;

  private constructor(pdfDoc: PDFDocument, fonts: FontSet) {
    this.pdfDoc = pdfDoc;
    this.fonts = fonts;
  }

  /**
   * Create a TemplateFiller from template bytes and font buffers.
   */
  static async create(
    templateBytes: ArrayBuffer,
    fontBuffers: {
      regular: ArrayBuffer;
      bold: ArrayBuffer;
      italic: ArrayBuffer;
      boldItalic: ArrayBuffer;
    }
  ): Promise<TemplateFiller> {
    const pdfDoc = await PDFDocument.load(templateBytes);
    pdfDoc.registerFontkit(fontkit);

    const fonts: FontSet = {
      regular: await pdfDoc.embedFont(fontBuffers.regular),
      bold: await pdfDoc.embedFont(fontBuffers.bold),
      italic: await pdfDoc.embedFont(fontBuffers.italic),
      boldItalic: await pdfDoc.embedFont(fontBuffers.boldItalic),
    };

    return new TemplateFiller(pdfDoc, fonts);
  }

  getDocument(): PDFDocument {
    return this.pdfDoc;
  }

  getPage(index: number): PDFPage {
    return this.pdfDoc.getPage(index);
  }

  getPageCount(): number {
    return this.pdfDoc.getPageCount();
  }

  getFonts(): FontSet {
    return this.fonts;
  }

  getFont(variant?: FieldPosition['fontVariant']): PDFFont {
    switch (variant) {
      case 'bold':
        return this.fonts.bold;
      case 'italic':
        return this.fonts.italic;
      case 'boldItalic':
        return this.fonts.boldItalic;
      default:
        return this.fonts.regular;
    }
  }

  /**
   * Stamp text onto a PDF page at the specified position.
   * Silently skips if text is empty or position is undefined.
   */
  stampText(page: PDFPage, text: string, position: FieldPosition): void {
    if (!text || !position) return;

    let displayText = text;
    if (position.transform === 'uppercase') {
      displayText = displayText.toUpperCase();
    } else if (position.transform === 'capitalize') {
      displayText = displayText.replace(/\b\w/g, (c) => c.toUpperCase());
    }

    const font = this.getFont(position.fontVariant);
    let effectiveFontSize = position.fontSize;
    const textWidth = font.widthOfTextAtSize(displayText, effectiveFontSize);

    // Handle overflow: shrink font if minFontSize is set, then truncate if still too wide
    if (textWidth > position.maxWidth) {
      if (position.minFontSize !== undefined && position.minFontSize < effectiveFontSize) {
        // Shrink font size down to minFontSize
        while (effectiveFontSize > position.minFontSize) {
          effectiveFontSize -= 0.5;
          if (font.widthOfTextAtSize(displayText, effectiveFontSize) <= position.maxWidth) break;
        }
        effectiveFontSize = Math.max(effectiveFontSize, position.minFontSize);
        // If still overflows at min size, truncate
        if (font.widthOfTextAtSize(displayText, effectiveFontSize) > position.maxWidth) {
          displayText = this.truncateToFit(displayText, font, effectiveFontSize, position.maxWidth);
        }
      } else {
        // Original behavior: truncate at original font size
        displayText = this.truncateToFit(displayText, font, effectiveFontSize, position.maxWidth);
      }
    }

    // Calculate x offset based on alignment
    let xOffset = position.x;
    const finalWidth = font.widthOfTextAtSize(displayText, effectiveFontSize);
    const alignment: TextAlignment = position.alignment ?? 'left';

    if (alignment === 'center') {
      xOffset = position.x + (position.maxWidth - finalWidth) / 2;
    } else if (alignment === 'right') {
      xOffset = position.x + position.maxWidth - finalWidth;
    }

    page.drawText(displayText, {
      x: xOffset,
      y: position.y,
      size: effectiveFontSize,
      font,
      color: rgb(0, 0, 0),
    });
  }

  /**
   * Stamp a checkmark onto a PDF page if the value is true.
   * Silently skips if position is undefined or checked is false.
   */
  stampCheckmark(page: PDFPage, position: CheckboxPosition, checked: boolean): void {
    if (!checked || !position) return;

    const style = position.style ?? 'checkmark';
    const char = style === 'x' ? 'X' : style === 'fill' ? 'X' : '/';

    page.drawText(char, {
      x: position.x,
      y: position.y,
      size: position.size,
      font: this.fonts.bold,
      color: rgb(0, 0, 0),
    });
  }

  /**
   * Embed an image (photo/signature) onto a PDF page.
   */
  async stampImage(
    page: PDFPage,
    imageBytes: Uint8Array,
    position: ImagePosition,
    mimeType: 'image/png' | 'image/jpeg'
  ): Promise<void> {
    const image =
      mimeType === 'image/png'
        ? await this.pdfDoc.embedPng(imageBytes)
        : await this.pdfDoc.embedJpg(imageBytes);

    // Scale to fit within bounding box while maintaining aspect ratio
    const aspectRatio = image.width / image.height;
    let drawWidth = position.width;
    let drawHeight = position.height;

    if (drawWidth / drawHeight > aspectRatio) {
      drawWidth = drawHeight * aspectRatio;
    } else {
      drawHeight = drawWidth / aspectRatio;
    }

    // Center within the bounding box
    const xOffset = position.x + (position.width - drawWidth) / 2;
    const yOffset = position.y + (position.height - drawHeight) / 2;

    page.drawImage(image, {
      x: xOffset,
      y: yOffset,
      width: drawWidth,
      height: drawHeight,
    });
  }

  /**
   * Embed an image from a URL onto a PDF page.
   */
  async stampImageFromUrl(
    page: PDFPage,
    imageUrl: string,
    position: ImagePosition
  ): Promise<void> {
    if (!imageUrl) return;

    try {
      const response = await fetch(imageUrl);
      if (!response.ok) return;

      const contentType = response.headers.get('content-type') ?? '';
      const imageBytes = new Uint8Array(await response.arrayBuffer());
      const mimeType: 'image/png' | 'image/jpeg' = contentType.includes('png')
        ? 'image/png'
        : 'image/jpeg';

      await this.stampImage(page, imageBytes, position, mimeType);
    } catch {
      // Silently fail — photo box remains empty
    }
  }

  /**
   * Add a blank page to the document.
   */
  addBlankPage(width: number, height: number): PDFPage {
    return this.pdfDoc.addPage([width, height]);
  }

  /**
   * Copy a page from another PDF document and append it.
   */
  async appendPagesFrom(sourceBytes: ArrayBuffer): Promise<void> {
    const sourceDoc = await PDFDocument.load(sourceBytes);
    const pageIndices = sourceDoc.getPageIndices();
    const copiedPages = await this.pdfDoc.copyPages(sourceDoc, pageIndices);
    for (const page of copiedPages) {
      this.pdfDoc.addPage(page);
    }
  }

  /**
   * Copy specific pages from another PDF and append them.
   */
  async appendPageFrom(sourceBytes: ArrayBuffer, pageIndex: number): Promise<PDFPage> {
    const sourceDoc = await PDFDocument.load(sourceBytes);
    const [copiedPage] = await this.pdfDoc.copyPages(sourceDoc, [pageIndex]);
    this.pdfDoc.addPage(copiedPage);
    return copiedPage;
  }

  /**
   * Save the filled PDF as bytes.
   */
  async save(): Promise<Uint8Array> {
    return this.pdfDoc.save();
  }

  /**
   * Truncate text to fit within maxWidth, using binary search.
   */
  private truncateToFit(
    text: string,
    font: PDFFont,
    fontSize: number,
    maxWidth: number
  ): string {
    let low = 0;
    let high = text.length;
    while (low < high) {
      const mid = Math.ceil((low + high) / 2);
      const substr = text.substring(0, mid);
      if (font.widthOfTextAtSize(substr, fontSize) <= maxWidth) {
        low = mid;
      } else {
        high = mid - 1;
      }
    }
    return text.substring(0, low);
  }
}
