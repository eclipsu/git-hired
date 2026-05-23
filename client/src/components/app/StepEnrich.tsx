import { useRef } from 'react';
import { copyToClipboard } from '../../utils/clipboard';
import { useCopyFeedback } from '../../hooks/useCopyFeedback';
import type { BulletItem } from '../../hooks/useAppState';

interface StepEnrichProps {
  bullets: BulletItem[];
  notes: string;
  parsedResume: { filename: string; text: string } | null;
  parsing: boolean;
  onToggleBullet: (id: string) => void;
  onNotesChange: (notes: string) => void;
  onFileSelect: (file: File) => void;
  onContinue: () => void;
}

export default function StepEnrich({
  bullets,
  notes,
  parsedResume,
  parsing,
  onToggleBullet,
  onNotesChange,
  onFileSelect,
  onContinue,
}: StepEnrichProps) {
  const { copiedId, markCopied } = useCopyFeedback();
  const fileRef = useRef<HTMLInputElement>(null);

  const grouped = bullets.reduce<Record<string, BulletItem[]>>((acc, b) => {
    if (!acc[b.displayName]) acc[b.displayName] = [];
    acc[b.displayName].push(b);
    return acc;
  }, {});

  const copyAllChecked = async () => {
    const text = bullets
      .filter((b) => b.included)
      .map((b) => `• ${b.text}`)
      .join('\n');
    await copyToClipboard(text);
    markCopied('all');
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:px-6">
      <div className="app-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[#1a1a1a]">Generated bullets</h2>
          <button
            type="button"
            onClick={copyAllChecked}
            className="text-sm text-[#5A7A6A] hover:underline"
          >
            {copiedId === 'all' ? 'Copied ✓' : 'Copy all checked'}
          </button>
        </div>

        {Object.entries(grouped).map(([displayName, items]) => (
          <div key={displayName} className="mb-6">
            <h3 className="mb-2 text-sm font-semibold text-[#334155]">{displayName}</h3>
            <ul className="space-y-2">
              {items.map((b) => (
                <li key={b.id} className="flex items-start gap-3 rounded-lg bg-[#FAFAF8] p-3">
                  <input
                    type="checkbox"
                    checked={b.included}
                    onChange={() => onToggleBullet(b.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-[#334155]">{b.text}</p>
                    <span className="mt-1 inline-block rounded bg-[#E8E8E4] px-2 py-0.5 text-[10px] text-[#64748B]">
                      {b.repo}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await copyToClipboard(b.text);
                      markCopied(b.id);
                    }}
                    className="shrink-0 text-xs text-[#64748B] hover:text-[#334155]"
                  >
                    {copiedId === b.id ? 'Copied ✓' : 'Copy'}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="my-8 border-t border-[#E8E8E4]" />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="app-card p-6">
          <h3 className="font-semibold text-[#1a1a1a]">Upload existing resume</h3>
          {parsedResume ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-[#5A7A6A]">
              <span className="font-medium text-[#334155]">{parsedResume.filename}</span>
              <span>Parsed ✓</span>
            </div>
          ) : (
            <button
              type="button"
              disabled={parsing}
              onClick={() => fileRef.current?.click()}
              className="mt-4 flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E8E8E4] px-4 py-10 text-sm text-[#64748B] hover:border-[#8BA888]/50"
            >
              {parsing ? 'Parsing...' : 'Drop PDF or DOCX here — click to browse'}
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFileSelect(file);
            }}
          />
        </div>

        <div className="app-card p-6">
          <h3 className="font-semibold text-[#1a1a1a]">Additional notes</h3>
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Internships, freelance work, certifications, education, anything not on GitHub..."
            className="mt-4 h-40 w-full resize-none rounded-xl border border-[#E8E8E4] p-3 text-sm"
          />
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={onContinue}
          className="rounded-xl bg-[#1a1a1a] px-6 py-3 text-sm font-semibold text-white"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
