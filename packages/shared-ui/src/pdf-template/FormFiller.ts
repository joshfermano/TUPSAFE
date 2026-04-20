/**
 * AcroForm-based PDF filler.
 *
 * Loads a fillable PDF template (with pre-positioned AcroForm fields),
 * fills fields by name, flattens to static content, and returns bytes.
 *
 * This replaces coordinate-based stamping with name-based filling:
 *   formFiller.setText('personalInfo.surname', 'SIMBAJON');
 *   formFiller.setCheckbox('cb.sex.male', true);
 */

import { PDFDocument, PDFFont, PDFForm, PDFPage, TextAlignment } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

export interface FontSet {
  regular: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
  boldItalic: PDFFont;
}

export interface FitOptions {
  /** Minimum font size before truncating (default: 5) */
  minFontSize?: number;
  /** Maximum font size to start from (default: derived from field height) */
  maxFontSize?: number;
  /** Text alignment within the field */
  alignment?: 'left' | 'center' | 'right';
}

export class FormFiller {
  private pdfDoc: PDFDocument;
  private form: PDFForm;
  private fonts: FontSet;

  private constructor(pdfDoc: PDFDocument, form: PDFForm, fonts: FontSet) {
    this.pdfDoc = pdfDoc;
    this.form = form;
    this.fonts = fonts;
  }

  /**
   * Create a FormFiller from a fillable template and font buffers.
   */
  static async create(
    templateBytes: ArrayBuffer,
    fontBuffers: {
      regular: ArrayBuffer;
      bold: ArrayBuffer;
      italic: ArrayBuffer;
      boldItalic: ArrayBuffer;
    }
  ): Promise<FormFiller> {
    const pdfDoc = await PDFDocument.load(templateBytes);
    pdfDoc.registerFontkit(fontkit);

    const fonts: FontSet = {
      regular: await pdfDoc.embedFont(fontBuffers.regular),
      bold: await pdfDoc.embedFont(fontBuffers.bold),
      italic: await pdfDoc.embedFont(fontBuffers.italic),
      boldItalic: await pdfDoc.embedFont(fontBuffers.boldItalic),
    };

    const form = pdfDoc.getForm();
    return new FormFiller(pdfDoc, form, fonts);
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

  getFont(variant?: 'regular' | 'bold' | 'italic' | 'boldItalic'): PDFFont {
    switch (variant) {
      case 'bold': return this.fonts.bold;
      case 'italic': return this.fonts.italic;
      case 'boldItalic': return this.fonts.boldItalic;
      default: return this.fonts.regular;
    }
  }

  /**
   * Set a text field value by name. Silently skips if field doesn't exist.
   */
  setText(fieldName: string, value: string): void {
    if (!value) return;
    try {
      const field = this.form.getTextField(fieldName);
      field.setText(value);
      field.updateAppearances(this.fonts.regular);
    } catch {
      // Field not in template — skip silently
    }
  }

  /**
   * Set a checkbox by name. Silently skips if field doesn't exist.
   */
  setCheckbox(fieldName: string, checked: boolean): void {
    try {
      const cb = this.form.getCheckBox(fieldName);
      if (checked) cb.check(); else cb.uncheck();
    } catch {
      // Field not in template — skip silently
    }
  }

  /**
   * Set a text field with smart font sizing: shrinks font to fit (down to
   * minFontSize), then truncates only if it still overflows.
   * Also supports setting alignment programmatically.
   */
  setTextWithFit(fieldName: string, value: string, options?: FitOptions): void {
    if (!value) return;
    try {
      const field = this.form.getTextField(fieldName);
      const minSize = options?.minFontSize ?? 5;
      const alignment = options?.alignment;

      // Set alignment if requested
      if (alignment === 'center') {
        field.setAlignment(TextAlignment.Center);
      } else if (alignment === 'right') {
        field.setAlignment(TextAlignment.Right);
      } else if (alignment === 'left') {
        field.setAlignment(TextAlignment.Left);
      }

      // Get available width from the field's widget rectangle
      const fieldWidth = this.getFieldWidth(field);
      if (fieldWidth <= 0) {
        // Fallback to basic setText if we can't measure
        field.setText(value);
        field.updateAppearances(this.fonts.regular);
        return;
      }

      // Determine starting font size (use field height as upper bound, capped at 14pt)
      const fieldHeight = this.getFieldHeight(field);
      const maxSize = options?.maxFontSize ?? Math.min(fieldHeight, 14);

      // Find the largest font size that fits, down to minSize
      let fontSize = maxSize;
      const font = this.fonts.regular;
      while (fontSize > minSize) {
        if (font.widthOfTextAtSize(value, fontSize) <= fieldWidth) break;
        fontSize -= 0.5;
      }
      fontSize = Math.max(fontSize, minSize);

      // Safety margin: if text fills >90% of field width, shrink one extra step
      // to prevent edge clipping from pdf-lib's internal appearance rendering
      const textWidth = font.widthOfTextAtSize(value, fontSize);
      if (textWidth > fieldWidth * 0.9 && fontSize > minSize) {
        fontSize = Math.max(fontSize - 0.5, minSize);
      }

      // If still overflows at minSize, truncate
      let displayText = value;
      if (font.widthOfTextAtSize(displayText, fontSize) > fieldWidth) {
        displayText = this.truncateToFit(displayText, font, fontSize, fieldWidth);
      }

      field.setFontSize(fontSize);
      field.setText(displayText);
      field.updateAppearances(this.fonts.regular);
    } catch {
      // Field not in template — skip silently
    }
  }

  /**
   * Fill a table: sets `{prefix}.{rowIndex}.{colKey}` for each row/column.
   * Extra template rows beyond data length are left empty (invisible).
   * When fitOptions is provided, uses setTextWithFit for smart font sizing.
   */
  fillTable(
    tableName: string,
    rows: Record<string, string>[],
    prefix?: string,
    fitOptions?: FitOptions
  ): void {
    const pfx = prefix ?? `tbl.${tableName}`;
    for (let i = 0; i < rows.length; i++) {
      for (const [key, value] of Object.entries(rows[i])) {
        const fieldName = `${pfx}.${i}.${key}`;
        if (fitOptions) {
          this.setTextWithFit(fieldName, value, fitOptions);
        } else {
          this.setText(fieldName, value);
        }
      }
    }
  }

  /**
   * Draw an image directly on a page (AcroForm has no image field type).
   */
  async drawImage(
    page: PDFPage,
    imageBytes: Uint8Array,
    position: { x: number; y: number; width: number; height: number },
    mimeType: 'image/png' | 'image/jpeg'
  ): Promise<void> {
    const image = mimeType === 'image/png'
      ? await this.pdfDoc.embedPng(imageBytes)
      : await this.pdfDoc.embedJpg(imageBytes);

    const aspectRatio = image.width / image.height;
    let drawWidth = position.width;
    let drawHeight = position.height;

    if (drawWidth / drawHeight > aspectRatio) {
      drawWidth = drawHeight * aspectRatio;
    } else {
      drawHeight = drawWidth / aspectRatio;
    }

    const xOffset = position.x + (position.width - drawWidth) / 2;
    const yOffset = position.y + (position.height - drawHeight) / 2;

    page.drawImage(image, {
      x: xOffset, y: yOffset, width: drawWidth, height: drawHeight,
    });
  }

  /**
   * Draw an image from URL onto a page.
   */
  async drawImageFromUrl(
    page: PDFPage,
    imageUrl: string,
    position: { x: number; y: number; width: number; height: number }
  ): Promise<void> {
    if (!imageUrl) return;
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) return;
      const contentType = response.headers.get('content-type') ?? '';
      const imageBytes = new Uint8Array(await response.arrayBuffer());
      const mimeType: 'image/png' | 'image/jpeg' = contentType.includes('png')
        ? 'image/png' : 'image/jpeg';
      await this.drawImage(page, imageBytes, position, mimeType);
    } catch {
      // Silently fail — photo box remains empty
    }
  }

  /**
   * Add a blank page (for overflow/continuation).
   */
  addBlankPage(width: number, height: number): PDFPage {
    return this.pdfDoc.addPage([width, height]);
  }

  /**
   * Remove a page by index.
   */
  removePage(index: number): void {
    this.pdfDoc.removePage(index);
  }

  /**
   * Flatten all form fields to static content (non-editable output).
   */
  flatten(): void {
    this.form.flatten();
  }

  /**
   * Save the PDF as bytes.
   */
  async save(): Promise<Uint8Array> {
    return this.pdfDoc.save();
  }

  /**
   * Widen a field's widget rectangle by a given amount (split evenly left/right).
   * Useful for education table fields where the template's narrow columns
   * cause text clipping after pdf-lib flattens the appearance stream.
   */
  widenField(fieldName: string, extraWidth: number): void {
    try {
      const field = this.form.getTextField(fieldName);
      const widgets = field.acroField.getWidgets();
      for (const w of widgets) {
        const rect = w.getRectangle();
        w.setRectangle({
          x: rect.x - extraWidth / 2,
          y: rect.y,
          width: rect.width + extraWidth,
          height: rect.height,
        });
      }
    } catch {
      // Field not in template — skip silently
    }
  }

  /**
   * Get the usable text width from a text field's first widget rectangle.
   * Returns 0 if the field has no widgets.
   */
  private getFieldWidth(field: ReturnType<PDFForm['getTextField']>): number {
    try {
      const widgets = field.acroField.getWidgets();
      if (widgets.length === 0) return 0;
      const rect = widgets[0].getRectangle();
      // AcroForm text fields have internal padding (~2pt each side)
      return Math.max(rect.width - 4, 0);
    } catch {
      return 0;
    }
  }

  /**
   * Get the usable text height from a text field's first widget rectangle.
   * Returns 10 as fallback if the field has no widgets.
   */
  private getFieldHeight(field: ReturnType<PDFForm['getTextField']>): number {
    try {
      const widgets = field.acroField.getWidgets();
      if (widgets.length === 0) return 10;
      const rect = widgets[0].getRectangle();
      return Math.max(rect.height - 2, 6);
    } catch {
      return 10;
    }
  }

  /**
   * Truncate text to fit within maxWidth using binary search.
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
