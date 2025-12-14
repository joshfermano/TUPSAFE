import { Document } from '@react-pdf/renderer';
import type { SALNData } from './types';
import { SALNPage1 } from './SALNPage1';
import { SALNPage2 } from './SALNPage2';
import { SALNPage3, shouldRenderSALNPage3 } from './SALNPage3';
import { SALNPage4, shouldRenderSALNPage4 } from './SALNPage4';

interface SALNDocumentProps {
  data: SALNData;
}

export function SALNDocument({ data }: SALNDocumentProps) {
  return (
    <Document
      title={`SALN ${data.year} - ${data.declarantInfo.surname}, ${data.declarantInfo.firstName}`}
      subject="Statement of Assets, Liabilities and Net Worth"
      creator="TUPSAFE System"
      author={`${data.declarantInfo.surname}, ${data.declarantInfo.firstName}`}
    >
      <SALNPage1 data={data} />
      <SALNPage2 data={data} />
      {shouldRenderSALNPage3(data) && <SALNPage3 data={data} />}
      {shouldRenderSALNPage4(data) && <SALNPage4 data={data} />}
    </Document>
  );
}
