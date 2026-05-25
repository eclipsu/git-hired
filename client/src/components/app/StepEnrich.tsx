import { useRef } from 'react';
import { Upload } from 'lucide-react';
import type { BulletItem } from '../../hooks/useAppState';
import ContactChat from './ContactChat';
import ResumePreview from '../resume/ResumePreview';
import Spinner from '../ui/Spinner';
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
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-6">
      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900">Upload existing resume</h3>
            <p className="mt-1 text-xs text-gray-500">Extract contact details and prior experience automatically.</p>
            <input ref={fileRef} type="file" accept=".pdf,.docx" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileSelect(f); }} />
            {parsedResume ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                {(parsing || extractingProfile) && <Spinner className="h-4 w-4" />}
                <span className="font-medium text-gray-700">{parsedResume.filename}</span>
                {!parsing && !extractingProfile && <span className="text-emerald-600">✓</span>}
                <button type="button" disabled={parsing || extractingProfile} onClick={() => fileRef.current?.click()} className="cursor-pointer text-xs text-[#7C3AED] hover:underline disabled:opacity-50">
                  Replace
                </button>
              </div>
            ) : (
              <button type="button" disabled={parsing} onClick={() => fileRef.current?.click()} className="mt-3 flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-8 text-sm text-gray-500 hover:border-[#7C3AED]/40">
                {parsing ? <><Spinner className="h-6 w-6" /><span>Parsing…</span></> : <><Upload className="h-5 w-5" /><span>Drop PDF or DOCX</span></>}
              </button>
            )}
          </div>

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

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900">Additional notes</h3>
            <p className="mt-1 text-xs text-gray-500">Internships, freelance work, soft skills, publications.</p>
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Anything not in GitHub or your resume…"
              className="mt-3 h-28 w-full resize-none rounded-lg border border-gray-200 p-3 text-sm"
            />
          </div>
        </aside>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Resume Preview</h2>
            <span className="text-xs text-gray-400">
              {bullets.filter((b) => b.included).length} bullets ready to review
            </span>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
            <ResumePreview contactInfo={contactInfo} bullets={bullets} />
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            {parsedResume && !contactComplete && (
              <p className="text-sm text-gray-500">
                Missing: {missingContactFields(contactInfo).map((f) => CONTACT_FIELD_LABELS[f]).join(', ')}
              </p>
            )}
            {!parsedResume && (
              <p className="text-sm text-gray-500">Upload a resume to extract contact info, or skip below.</p>
            )}
            <div className="ml-auto flex flex-wrap gap-2">
              {!parsedResume && (
                <button type="button" onClick={onSkip} className="btn-secondary">
                  Skip upload → Tailor
                </button>
              )}
              <button type="button" disabled={!canContinue} onClick={onContinue} className="btn-accent">
                Continue to tailor →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
