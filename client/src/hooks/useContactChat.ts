import { useCallback, useRef, useState } from 'react';
import {
  CONTACT_FIELD_EXAMPLES,
  CONTACT_FIELD_LABELS,
  type ChatMessage,
  type ContactInfo,
  emptyContactInfo,
  isContactComplete,
  mergeContactInfo,
  missingContactFields,
  REQUIRED_CONTACT_FIELDS,
} from '../types/contact';

function botMessage(text: string): ChatMessage {
  return { id: crypto.randomUUID(), role: 'bot', text };
}

function userMessage(text: string): ChatMessage {
  return { id: crypto.randomUUID(), role: 'user', text };
}

function askPrompt(field: keyof ContactInfo): string {
  const label = CONTACT_FIELD_LABELS[field];
  const example = CONTACT_FIELD_EXAMPLES[field];
  if (example) {
    return `I couldn't find your ${label} on the resume. What's your ${label}? (e.g. ${example})`;
  }
  return `What's your ${label}?`;
}

function hasStoredContact(saved: ContactInfo | null | undefined): boolean {
  if (!saved) return false;
  return REQUIRED_CONTACT_FIELDS.some((field) => saved[field]?.trim());
}

async function saveContactToDb(contact: ContactInfo): Promise<void> {
  await fetch('/api/session/contact', {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(contact),
  });
}

export function useContactChat(githubUsername?: string) {
  const [contactInfo, setContactInfo] = useState<ContactInfo>(() =>
    emptyContactInfo(githubUsername),
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingField, setPendingField] = useState<keyof ContactInfo | null>(null);
  const [extracting, setExtracting] = useState(false);
  const contactInitRef = useRef(false);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const persistContact = useCallback((contact: ContactInfo) => {
    clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      saveContactToDb(contact).catch(() => {});
    }, 400);
  }, []);

  const applyContact = useCallback(
    (contact: ContactInfo) => {
      setContactInfo(contact);
      persistContact(contact);
    },
    [persistContact],
  );

  const queueNextQuestion = useCallback((contact: ContactInfo) => {
    const missing = missingContactFields(contact);
    if (missing.length === 0) {
      setPendingField(null);
      setMessages((prev) => [
        ...prev,
        botMessage(
          "Great — I have everything for your resume header. Edit the fields above anytime, or continue when you're ready.",
        ),
      ]);
      return;
    }

    const nextField = missing[0];
    setPendingField(nextField);
    setMessages((prev) => [...prev, botMessage(askPrompt(nextField))]);
  }, []);

  const applyExtractedContact = useCallback(
    (profile: ContactInfo) => {
      applyContact(profile);

      const found = (Object.keys(profile) as (keyof ContactInfo)[]).filter(
        (k) => profile[k]?.trim(),
      );
      const foundLabels = found.map((k) => CONTACT_FIELD_LABELS[k]).join(', ');

      setMessages([
        botMessage(
          foundLabels
            ? `I scanned your resume and found: ${foundLabels}.`
            : "I scanned your resume but couldn't find contact details — let's fill them in.",
        ),
      ]);

      queueNextQuestion(profile);
    },
    [applyContact, queueNextQuestion],
  );

  const runExtraction = useCallback(
    async (resumeText: string) => {
      setExtracting(true);
      setMessages([botMessage('Scanning your resume for contact details...')]);

      try {
        const res = await fetch('/api/extract-profile', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resumeText, githubUsername }),
        });

        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? 'Profile extraction failed');
        }

        const { profile } = (await res.json()) as { profile: ContactInfo };
        applyExtractedContact(profile);
      } catch (err) {
        const fallback = mergeContactInfo(emptyContactInfo(githubUsername), contactInfo);
        setMessages([
          botMessage(
            err instanceof Error
              ? `${err.message} — please fill in the fields below or answer here.`
              : 'Could not extract contact info. Please fill in the fields below.',
          ),
        ]);
        queueNextQuestion(fallback);
      } finally {
        setExtracting(false);
      }
    },
    [applyExtractedContact, contactInfo, githubUsername, queueNextQuestion],
  );

  const initContactFromResume = useCallback(
    (saved: ContactInfo | null, resumeText: string, force = false) => {
      if (contactInitRef.current && !force) return;
      contactInitRef.current = true;

      const base = mergeContactInfo(emptyContactInfo(githubUsername), saved ?? {});

      if (hasStoredContact(saved)) {
        applyContact(base);
        const missing = missingContactFields(base);
        if (missing.length === 0) {
          setMessages([
            botMessage('Your contact details are loaded from your saved resume session.'),
          ]);
        } else {
          setMessages([
            botMessage(
              'Your resume is on file. I still need a few contact details for your resume header.',
            ),
          ]);
          queueNextQuestion(base);
        }
        return;
      }

      void runExtraction(resumeText);
    },
    [applyContact, githubUsername, queueNextQuestion, runExtraction],
  );

  const resetContactInit = useCallback(() => {
    contactInitRef.current = false;
  }, []);

  const applyParsedContact = useCallback(
    (profile: ContactInfo | null | undefined, resumeText: string) => {
      contactInitRef.current = true;
      if (profile && hasStoredContact(profile)) {
        applyExtractedContact(profile);
        return;
      }
      void runExtraction(resumeText);
    },
    [applyExtractedContact, runExtraction],
  );

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      setMessages((prev) => [...prev, userMessage(trimmed)]);

      if (pendingField) {
        const updated = { ...contactInfo, [pendingField]: trimmed };
        applyContact(updated);
        queueNextQuestion(updated);
        return;
      }

      const pipeMatch = trimmed.match(
        /^([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*(.+)$/,
      );
      if (pipeMatch) {
        const [, phone, email, linkedin, github] = pipeMatch;
        const updated: ContactInfo = {
          ...contactInfo,
          phone: phone.trim(),
          email: email.trim(),
          linkedin: linkedin.trim(),
          github: github.trim(),
        };
        applyContact(updated);
        setMessages((prev) => [
          ...prev,
          botMessage('Got it — saved your phone, email, LinkedIn, and GitHub.'),
        ]);
        queueNextQuestion(updated);
        return;
      }

      setMessages((prev) => [
        ...prev,
        botMessage(
          'Type one detail at a time, or paste: 123-456-7890 | jake@su.edu | linkedin.com/in/jake | github.com/jake',
        ),
      ]);
      queueNextQuestion(contactInfo);
    },
    [applyContact, contactInfo, pendingField, queueNextQuestion],
  );

  const updateField = useCallback(
    (field: keyof ContactInfo, value: string) => {
      setContactInfo((c) => {
        const updated = { ...c, [field]: value };
        persistContact(updated);
        return updated;
      });
    },
    [persistContact],
  );

  return {
    contactInfo,
    messages,
    pendingField: pendingField as keyof ContactInfo | null,
    extracting,
    complete: isContactComplete(contactInfo),
    initContactFromResume,
    resetContactInit,
    applyParsedContact,
    sendMessage,
    updateField,
  };
}
