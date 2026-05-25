import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import latex from 'node-latex';

const TEXMF_HOME = path.join(process.cwd(), 'tex', 'texmf');

/** Vendored fontawesome5 (~750KB) — avoids texlive-fonts-extra on small EC2. */
if (fs.existsSync(TEXMF_HOME)) {
  process.env.TEXMFHOME = TEXMF_HOME;
}

export function compileTexToPdf(tex: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const input = Readable.from([tex]);
    const pdf = latex(input, { errorLogs: 'buffer' as unknown as string });
    const chunks: Buffer[] = [];

    pdf.on('data', (chunk: Buffer) => chunks.push(chunk));
    pdf.on('end', () => resolve(Buffer.concat(chunks)));
    pdf.on('error', reject);
  });
}
