import { useEffect, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { StreamLanguage } from '@codemirror/language';
import { stex } from '@codemirror/legacy-modes/mode/stex';
import { copyToClipboard } from '../../utils/clipboard';
import { useCopyFeedback } from '../../hooks/useCopyFeedback';
import type { BulletItem } from '../../hooks/useAppState';

interface StepExportProps {
  tex: string;
  originalTex: string;
  atsMatchPercent: number;
  bullets: BulletItem[];
  onTexChange: (tex: string) => void;
  onRetailer: () => void;
  onCompile: (tex: string) => Promise<Blob>;
}

function atsBadgeClass(pct: number): string {
  if (pct > 80) return 'bg-[#E8EDE8] text-[#5A7A6A]';
  if (pct >= 60) return 'bg-[#FEF3C7] text-[#92400E]';
  return 'bg-[#FEE2E2] text-[#991B1B]';
}

export default function StepExport({
  tex,
  originalTex,
  atsMatchPercent,
  bullets,
  onTexChange,
  onRetailer,
  onCompile,
}: StepExportProps) {
  const { copiedId, markCopied } = useCopyFeedback();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [compiling, setCompiling] = useState(false);
  const [compileError, setCompileError] = useState<string | null>(null);

  const handleCompile = async () => {
    setCompiling(true);
    setCompileError(null);
    try {
      const blob = await onCompile(tex);
      const url = URL.createObjectURL(blob);
      setPdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch (err) {
      setCompileError(err instanceof Error ? err.message : 'Compile failed');
    } finally {
      setCompiling(false);
    }
  };

  useEffect(() => {
    if (tex) handleCompile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () => () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    },
    [pdfUrl],
  );

  const copyBullets = async () => {
    const text = bullets.filter((b) => b.included).map((b) => `• ${b.text}`).join('\n');
    await copyToClipboard(text);
    markCopied('bullets');
  };

  const downloadPdf = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = 'resume.pdf';
    a.click();
  };

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-[#E8E8E4] bg-white/80 px-4 py-3">
        <button type="button" onClick={onRetailer} className="text-sm text-[#64748B] hover:text-[#1a1a1a]">
          ← Re-tailor
        </button>
        <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${atsBadgeClass(atsMatchPercent)}`}>
          ATS match {atsMatchPercent}%
        </span>
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={copyBullets} className="rounded-lg border border-[#E8E8E4] px-3 py-1.5 text-xs">
            {copiedId === 'bullets' ? 'Copied ✓' : 'Copy all bullets'}
          </button>
          <button
            type="button"
            disabled={!pdfUrl}
            onClick={downloadPdf}
            className="rounded-lg bg-[#1a1a1a] px-3 py-1.5 text-xs text-white disabled:opacity-50"
          >
            Download PDF
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
        <div className="flex w-full flex-col border-r border-[#E8E8E4] lg:w-1/2">
          <div className="flex gap-2 border-b border-[#E8E8E4] px-3 py-2">
            <button type="button" onClick={handleCompile} disabled={compiling} className="rounded px-2 py-1 text-xs border border-[#E8E8E4]">
              {compiling ? 'Compiling...' : 'Compile'}
            </button>
            <button type="button" onClick={() => onTexChange(originalTex)} className="rounded px-2 py-1 text-xs border border-[#E8E8E4]">
              Reset
            </button>
            <button
              type="button"
              onClick={async () => {
                await copyToClipboard(tex);
                markCopied('latex');
              }}
              className="rounded px-2 py-1 text-xs border border-[#E8E8E4]"
            >
              {copiedId === 'latex' ? 'Copied ✓' : 'Copy LaTeX'}
            </button>
          </div>
          <div className="flex-1 overflow-auto font-mono text-sm">
            <CodeMirror
              value={tex}
              height="100%"
              extensions={[StreamLanguage.define(stex)]}
              onChange={onTexChange}
              basicSetup={{ lineNumbers: true }}
            />
          </div>
          {compileError && (
            <div className="border-t border-red-200 bg-red-50 p-4 text-xs text-red-800">
              <div className="flex justify-between gap-4">
                <span className="font-medium">LaTeX error</span>
                <button type="button" onClick={() => setCompileError(null)}>Dismiss</button>
              </div>
              <pre className="mt-2 whitespace-pre-wrap">{compileError}</pre>
              {compileError.includes('pdflatex') && (
                <p className="mt-3 rounded-lg bg-white/80 p-3 font-sans text-red-900">
                  Run in your terminal:
                  <code className="mt-1 block text-[11px]">
                    sudo apt install -y texlive-latex-base texlive-latex-extra texlive-fonts-recommended texlive-fonts-extra
                  </code>
                  Then restart the server and click Compile again.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="relative w-full flex-1 lg:w-1/2">
          {compiling && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <svg className="h-8 w-8 animate-spin text-[#5A7A6A]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}
          {pdfUrl ? (
            <iframe title="PDF preview" src={pdfUrl} className="h-full w-full" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[#64748B]">
              Compile to preview PDF
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
