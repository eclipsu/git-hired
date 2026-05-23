import { useRef, useState } from 'react';
import { RefreshCw, Upload } from 'lucide-react';
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
  onToggleBullet: (id: string) => void;
  onNotesChange: (notes: string) => void;
  onFileSelect: (file: File) => void;
  onContactFieldChange: (field: keyof ContactInfo, value: string) => void;
  onChatSend: (text: string) => void;
  onContinue: () => void;
}

const SECTIONS = ['Summary', 'Projects', 'Skills', 'Education', 'Experience'] as const;

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
  onToggleBullet,
  onNotesChange,
  onFileSelect,
  onContactFieldChange,
  onChatSend,
  onContinue,
}: StepEnrichProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [template, setTemplate] = useState('Jake (ATS)');
  const [level, setLevel] = useState('Mid');
  const [tone, setTone] = useState('Impact-focused');
  const [sections, setSections] = useState<Record<string, boolean>>(
    Object.fromEntries(SECTIONS.map((s) => [s, true])),
  );
  const [showBullets, setShowBullets] = useState(false);

  const canContinue = Boolean(parsedResume) && contactComplete;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-6">
      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900">Resume Settings</h3>
            <div className="mt-4 space-y-3">
              <label className="block text-xs font-semibold uppercase text-gray-500">
                Template
                <select value={template} onChange={(e) => setTemplate(e.target.value)} className="mt-1 w-full cursor-pointer rounded-lg border border-gray-200 px-3 py-2 text-sm">
                  <option>Jake (ATS)</option>
                </select>
              </label>
              <label className="block text-xs font-semibold uppercase text-gray-500">
                Experience Level
                <select value={level} onChange={(e) => setLevel(e.target.value)} className="mt-1 w-full cursor-pointer rounded-lg border border-gray-200 px-3 py-2 text-sm">
                  <option>Junior</option>
                  <option>Mid</option>
                  <option>Senior</option>
                </select>
              </label>
              <label className="block text-xs font-semibold uppercase text-gray-500">
                Tone
                <select value={tone} onChange={(e) => setTone(e.target.value)} className="mt-1 w-full cursor-pointer rounded-lg border border-gray-200 px-3 py-2 text-sm">
                  <option>Impact-focused</option>
                  <option>Conversational</option>
                  <option>Technical</option>
                </select>
              </label>
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase text-gray-500">Sections</p>
              {SECTIONS.map((s) => (
                <label key={s} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={sections[s]}
                    onChange={() => setSections((prev) => ({ ...prev, [s]: !prev[s] }))}
                    className="cursor-pointer rounded border-gray-300 text-[#7C3AED]"
                  />
                  {s}
                </label>
              ))}
            </div>
            <button type="button" className="btn-primary mt-4 w-full !rounded-lg !py-2.5 !text-sm">
              <RefreshCw className="h-4 w-4" />
              Regenerate All
            </button>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900">Upload existing resume</h3>
            <p className="mt-1 text-xs text-gray-500">Extract contact details automatically.</p>
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
            <button type="button" onClick={() => setShowBullets((s) => !s)} className="cursor-pointer text-sm font-medium text-[#7C3AED] hover:underline">
              {showBullets ? 'Hide' : 'Edit'} generated bullets ({bullets.filter((b) => b.included).length})
            </button>
            {showBullets && (
              <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto">
                {bullets.map((b) => (
                  <li key={b.id} className="flex gap-2 text-xs">
                    <input type="checkbox" checked={b.included} onChange={() => onToggleBullet(b.id)} className="cursor-pointer mt-0.5" />
                    <span className="text-gray-600">{b.text.slice(0, 100)}…</span>
                  </li>
                ))}
              </ul>
            )}
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Additional notes…"
              className="mt-3 h-20 w-full resize-none rounded-lg border border-gray-200 p-2 text-xs"
            />
          </div>
        </aside>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Resume Preview</h2>
            <span className="text-xs text-gray-400">Live preview from your data</span>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
            <ResumePreview contactInfo={contactInfo} bullets={bullets} />
          </div>
          <div className="mt-6 flex items-center justify-between">
            {parsedResume && !contactComplete && (
              <p className="text-sm text-gray-500">
                Missing: {missingContactFields(contactInfo).map((f) => CONTACT_FIELD_LABELS[f]).join(', ')}
              </p>
            )}
            {!parsedResume && <p className="text-sm text-gray-500">Upload your resume to continue.</p>}
            <button type="button" disabled={!canContinue} onClick={onContinue} className="btn-accent ml-auto">
              Continue →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
