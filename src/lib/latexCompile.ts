import { Readable } from 'stream';
import latex from 'node-latex';
import { configureTexmfHome, getFontAwesomeAssetStatus } from './appPaths';

/** Vendored fontawesome5 (PFB + TFM + map) — production has no texlive-fonts-extra. */
configureTexmfHome();

export function getLatexFontStatus(): ReturnType<typeof getFontAwesomeAssetStatus> {
  return getFontAwesomeAssetStatus();
}

export function compileTexToPdf(tex: string): Promise<Buffer> {
  const texmfHome = configureTexmfHome();
  if (!texmfHome) {
    const { missing } = getFontAwesomeAssetStatus();
    return Promise.reject(
      new Error(
        `Vendored Font Awesome files missing (required in production Docker). Missing: ${missing.join(', ')}`,
      ),
    );
  }

  return new Promise((resolve, reject) => {
    const input = Readable.from([tex]);
    const pdf = latex(input, { errorLogs: 'buffer' as unknown as string });
    const chunks: Buffer[] = [];

    pdf.on('data', (chunk: Buffer) => chunks.push(chunk));
    pdf.on('end', () => resolve(Buffer.concat(chunks)));
    pdf.on('error', reject);
  });
}
