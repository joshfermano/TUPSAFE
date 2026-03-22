// Core pdf-lib template filling engine
export { TemplateFiller } from './TemplateFiller';
export { FormFiller } from './FormFiller';
export type { FontSet as FormFillerFontSet } from './FormFiller';
export type { FontSet } from './TemplateFiller';
export { loadAllFonts, getFontUrls, clearFontCache } from './FontManager';
export type { FontBuffers, FontUrls } from './FontManager';
export { fillTable } from './TableFiller';
export type { TableRowData, TableFillResult } from './TableFiller';
export {
  formatDateMMDDYYYY,
  formatYear,
  formatCurrency,
  displayOrEmpty,
  getNestedValue,
  applyFormatter,
} from './utils';
export type {
  FieldPosition,
  CheckboxPosition,
  ImagePosition,
  TableColumn,
  TableConfig,
  PageFieldMap,
  TemplateConfig,
  TextAlignment,
} from './types';
