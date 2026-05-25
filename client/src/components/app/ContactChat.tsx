import { useEffect, useRef } from 'react';
import GitHubBox from '../github/GitHubBox';
import GitHubButton from '../github/GitHubButton';
import { CONTACT_FIELD_LABELS, type ChatMessage, type ContactInfo } from '../../types/contact';

interface ContactChatProps {
  contactInfo: ContactInfo;
  messages: ChatMessage[];
  pendingField: keyof ContactInfo | null;
  extracting: boolean;
  onFieldChange: (field: keyof ContactInfo, value: string) => void;
  onSendMessage: (text: string) => void;
}

export default function ContactChat({
  contactInfo,
  messages,
  pendingField,
  extracting,
  onFieldChange,
  onSendMessage,
}: ContactChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, extracting]);

  useEffect(() => {
    if (pendingField) inputRef.current?.focus();
  }, [pendingField]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = inputRef.current?.value ?? '';
    if (!value.trim()) return;
    onSendMessage(value);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <GitHubBox className="!p-0 overflow-hidden">
      <div className="border-b border-[var(--gh-border-muted)] px-4 py-3">
        <h3 className="text-sm font-semibold">Contact details</h3>
      </div>

      <div className="grid gap-3 px-4 py-3 md:grid-cols-2">
        {(Object.keys(CONTACT_FIELD_LABELS) as (keyof ContactInfo)[]).map((field) => (
          <label key={field} className="block">
            <span className="gh-form-label !text-xs">{CONTACT_FIELD_LABELS[field]}</span>
            <input type="text" value={contactInfo[field]} onChange={(e) => onFieldChange(field, e.target.value)} className="gh-input mt-1" />
          </label>
        ))}
      </div>

      <div className="border-t border-[var(--gh-border-muted)] bg-[var(--gh-canvas-subtle)]">
        <div ref={scrollRef} className="max-h-48 space-y-2 overflow-y-auto px-4 py-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={msg.role === 'user' ? 'gh-comment gh-comment-user' : 'gh-comment gh-comment-bot'}>{msg.text}</div>
            </div>
          ))}
          {extracting && (
            <div className="gh-comment gh-comment-bot text-[var(--gh-fg-muted)]">Scanning resume…</div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 border-t border-[var(--gh-border-muted)] px-3 py-3">
          <input
            ref={inputRef}
            type="text"
            disabled={extracting}
            placeholder={pendingField ? `Enter ${CONTACT_FIELD_LABELS[pendingField]}…` : 'Type a message…'}
            className="gh-input flex-1"
          />
          <GitHubButton type="submit" variant="primary" disabled={extracting}>Send</GitHubButton>
        </form>
      </div>
    </GitHubBox>
  );
}
