import { useRef } from 'react';
import GitHubBox from '../github/GitHubBox';
import GitHubButton from '../github/GitHubButton';
import ContactChat from './ContactChat';
import ResumePreview from '../resume/ResumePreview';
import Spinner from '../ui/Spinner';
import type { BulletItem } from '../../hooks/useAppState';
import type { ChatMessage, ContactInfo } from '../../types/contact';
import { CONTACT_FIELD_LABELS, missingContactFields } from '../../types/contact';

interface StepEnrichProps {
  bullets: BulletItem[];
  notes: string;
  parsedResume: { filename: string; text: string } | null;
  parsing: boolean;
  contactInfo: ContactInfo;
  chatMessages: ChatMessage[];
  pendingChatField: keyof ContactInfo | null;
  extractingProfile: boolean;
  contactComplete: boolean;
  onNotesChange: (notes: string) => void;
  onFileSelect: (file: File) => void;
  onContactFieldChange: (field: keyof ContactInfo, value: string) => void;
  onChatSend: (text: string) => void;
  onContinue: () => void;
  onSkip: () => void;
}

export default function StepEnrich({
  bullets,
  notes,
  parsedResume,
  parsing,
  contactInfo,
  chatMessages,
  pendingChatField,
  extractingProfile,
  contactComplete,
  onNotesChange,
  onFileSelect,
  onContactFieldChange,
  onChatSend,
  onContinue,
  onSkip,
}: StepEnrichProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const canContinue = Boolean(parsedResume) && contactComplete;

  return (
    <div className="gh-container-wide py-6">
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="space-y-4">
          <GitHubBox>
            <h3 className="text-sm font-semibold">Upload resume</h3>
            <p className="mt-1 text-xs text-[var(--gh-fg-muted)]">Extract contact info from PDF or DOCX.</p>
            <input ref={fileRef} type="file" accept=".pdf,.docx" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileSelect(f); }} />
            {parsedResume ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                {(parsing || extractingProfile) && <Spinner />}
                <span className="font-medium">{parsedResume.filename}</span>
                {!parsing && !extractingProfile && <span className="text-[var(--gh-success-fg)]">✓</span>}
                <button type="button" disabled={parsing || extractingProfile} onClick={() => fileRef.current?.click()} className="gh-link cursor-pointer text-xs disabled:opacity-50">Replace</button>
              </div>
            ) : (
              <button
                type="button"
                disabled={parsing}
                onClick={() => fileRef.current?.click()}
                className="mt-3 flex w-full cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed border-[var(--gh-border-default)] bg-[var(--gh-canvas-subtle)] py-8 text-sm text-[var(--gh-fg-muted)] hover:border-[var(--gh-accent-emphasis)]"
              >
                {parsing ? <><Spinner /><span>Parsing…</span></> : 'Drop PDF or DOCX'}
              </button>
            )}
          </GitHubBox>

          {parsedResume && (
            <ContactChat
              contactInfo={contactInfo}
              messages={chatMessages}
              pendingField={pendingChatField}
              extracting={extractingProfile}
              onFieldChange={onContactFieldChange}
              onSendMessage={onChatSend}
            />
          )}

          <GitHubBox>
            <h3 className="text-sm font-semibold">Additional notes</h3>
            <textarea value={notes} onChange={(e) => onNotesChange(e.target.value)} placeholder="Internships, freelance, etc." className="gh-textarea mt-3 h-28" />
          </GitHubBox>
        </aside>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Preview</h2>
            <span className="text-xs text-[var(--gh-fg-muted)]">{bullets.filter((b) => b.included).length} bullets</span>
          </div>
          <div className="overflow-hidden rounded-md border border-[var(--gh-border-default)]">
            <ResumePreview contactInfo={contactInfo} bullets={bullets} />
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            {parsedResume && !contactComplete && (
              <p className="text-sm text-[var(--gh-fg-muted)]">
                Missing: {missingContactFields(contactInfo).map((f) => CONTACT_FIELD_LABELS[f]).join(', ')}
              </p>
            )}
            {!parsedResume && <p className="text-sm text-[var(--gh-fg-muted)]">Upload a resume or skip to tailor.</p>}
            <div className="ml-auto flex gap-2">
              {!parsedResume && <GitHubButton variant="default" onClick={onSkip}>Skip to tailor</GitHubButton>}
              <GitHubButton variant="primary" disabled={!canContinue} onClick={onContinue}>Continue</GitHubButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
