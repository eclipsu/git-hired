import { useEffect, useRef } from 'react';
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
    <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-5 py-4">
        <h3 className="font-semibold text-gray-900">Contact details</h3>
      </div>

      <div className="grid gap-3 px-5 py-4 md:grid-cols-2">
        {(Object.keys(CONTACT_FIELD_LABELS) as (keyof ContactInfo)[]).map((field) => (
          <label key={field} className="block text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase text-gray-500">
              {CONTACT_FIELD_LABELS[field]}
            </span>
            <input
              type="text"
              value={contactInfo[field]}
              onChange={(e) => onFieldChange(field, e.target.value)}
              className="w-full cursor-text rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
            />
          </label>
        ))}
      </div>

      <div className="border-t border-gray-200 bg-gray-50">
        <div ref={scrollRef} className="max-h-48 space-y-3 overflow-y-auto px-5 py-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-gray-900 text-white'
                    : 'border border-gray-200 bg-white text-gray-700'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {extracting && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-500">
                <i className="fa-solid fa-spinner fa-spin mr-2" />
                Scanning your resume…
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 border-t border-gray-200 px-4 py-3">
          <input
            ref={inputRef}
            type="text"
            disabled={extracting}
            placeholder={
              pendingField
                ? `Enter your ${CONTACT_FIELD_LABELS[pendingField]}…`
                : 'Type a detail or answer the chatbot…'
            }
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={extracting}
            className="cursor-pointer rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
