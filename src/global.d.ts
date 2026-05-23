declare module 'pdf-parse' {
  interface PdfParseResult {
    text: string;
    numpages: number;
  }

  function pdfParse(buffer: Buffer): Promise<PdfParseResult>;
  export default pdfParse;
}

declare module 'node-latex' {
  import { Readable } from 'stream';

  function latex(
    input: Readable,
    options?: { errorLogs?: string | boolean },
  ): NodeJS.ReadableStream;

  export default latex;
}
