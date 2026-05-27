import { useRef, useState } from 'react';
import { ChevronRight, FileText, Upload, X } from 'lucide-react';
import GlowButton from '../ui/GlowButton';
import PageTopBar from '../ui/PageTopBar';
import Spinner from '../ui/Spinner';

interface StepEnrichProps {
  notes: string;
  parsedResume: { filename: string; text: string } | null;
  parsing: boolean;
  extractingProfile: boolean;
  onNotesChange: (notes: string) => void;
  onFileSelect: (file: File) => void;
  onContinue: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export default function StepEnrich({
  notes,
  parsedResume,
  parsing,
  extractingProfile,
  onNotesChange,
  onFileSelect,
  onContinue,
  onSkip,
  onBack,
}: StepEnrichProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onFileSelect(f);
  }

  return (
    <div className="min-h-screen bg-background">
      <PageTopBar back={{ label: 'bullets', onClick: onBack }} crumb="enrich" />

      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="font-display font-bold text-2xl text-foreground mb-2">Add more context</h1>
        <p className="text-muted-foreground text-sm mb-8">
          The more we know, the better your resume.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-3 block">
              Upload existing resume
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFileSelect(f);
              }}
            />
            {parsedResume ? (
              <div className="p-4 rounded border border-border bg-card space-y-2">
                <div className="flex items-center gap-3">
                  {(parsing || extractingProfile) && <Spinner />}
                  <FileText size={16} className="text-primary flex-shrink-0" />
                  <span className="font-mono text-sm text-foreground flex-1 truncate">
                    {parsedResume.filename}
                  </span>
                  {!parsing && !extractingProfile && (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="text-xs font-mono text-primary hover:underline cursor-pointer"
                    >
                      Replace
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
                {extractingProfile && (
                  <p className="text-xs text-muted-foreground font-mono">
                    Extracting contact info from your resume…
                  </p>
                )}
                {!extractingProfile && !parsing && (
                  <p className="text-xs text-success font-mono">
                    Resume parsed — contact details will be pulled automatically.
                  </p>
                )}
              </div>
            ) : (
              <button
                type="button"
                disabled={parsing}
                className="w-full h-48 rounded border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all"
                style={{
                  borderColor: dragging ? '#58A6FF' : '#30363D',
                  backgroundColor: dragging ? 'rgba(88,166,255,0.05)' : '#161B22',
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
              >
                {parsing ? (
                  <>
                    <Spinner />
                    <span className="text-sm text-muted-foreground">Parsing…</span>
                  </>
                ) : (
                  <>
                    <Upload size={24} style={{ color: dragging ? '#58A6FF' : '#8B949E' }} />
                    <div className="text-center">
                      <p className="text-sm text-foreground">Drop your resume here</p>
                      <p className="text-xs font-mono text-muted-foreground mt-1">PDF or DOCX</p>
                    </div>
                  </>
                )}
              </button>
            )}
          </div>

          <div>
            <label className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-3 block">
              Anything else we should know?
            </label>
            <textarea
              className="w-full h-48 rounded border border-border bg-card text-foreground text-sm p-4 resize-none placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
              placeholder="e.g. I interned at a startup in 2022, I speak Spanish, I have a CS degree from UT Austin, I'm targeting staff-level roles at infrastructure companies..."
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-muted-foreground font-mono">
            {parsedResume
              ? 'Resume uploaded — continue when ready'
              : 'Upload a resume or skip to tailor'}
          </p>
          <div className="flex gap-3">
            {!parsedResume && (
              <GlowButton onClick={onSkip} variant="ghost" className="font-mono text-sm">
                Skip to tailor
              </GlowButton>
            )}
            <GlowButton
              onClick={onContinue}
              disabled={parsing}
              className="font-semibold"
            >
              Continue
              <ChevronRight size={16} />
            </GlowButton>
          </div>
        </div>
      </div>
    </div>
  );
}
