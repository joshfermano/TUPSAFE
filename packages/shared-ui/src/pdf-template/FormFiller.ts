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

import { PDFDocument, PDFFont, PDFForm, PDFPage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

export interface FontSet {
  regular: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
  boldItalic: PDFFont;
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
   * Fill a table: sets `{prefix}.{rowIndex}.{colKey}` for each row/column.
   * Extra template rows beyond data length are left empty (invisible).
   */
  fillTable(
    tableName: string,
    rows: Record<string, string>[],
    prefix?: string
  ): void {
    const pfx = prefix ?? `tbl.${tableName}`;
    for (let i = 0; i < rows.length; i++) {
      for (const [key, value] of Object.entries(rows[i])) {
        this.setText(`${pfx}.${i}.${key}`, value);
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
}
