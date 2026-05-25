const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has',
  'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
  'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'we', 'you', 'they', 'he',
  'she', 'it', 'this', 'that', 'these', 'those', 'i', 'my', 'your', 'our', 'their',
]);

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9+#.\s-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w)),
  );
}

export function computeAtsMatch(jobDescription: string, bulletText: string): number {
  if (!jobDescription.trim()) return 0;

  const jdWords = tokenize(jobDescription);
  if (jdWords.size === 0) return 0;

  const bulletWords = tokenize(bulletText);
  let overlap = 0;
  jdWords.forEach((w) => {
    if (bulletWords.has(w)) overlap += 1;
  });

  return Math.min(100, Math.round((overlap / jdWords.size) * 100));
}

export function tailoredResumeToText(resume: {
  summary?: string;
  skills?: Record<string, string[]>;
  softSkills?: string[];
  experience?: { bullets: string[]; title?: string; org?: string }[];
  projects?: { bullets: string[]; name?: string; techStack?: string }[];
  leadership?: { bullets: string[]; role?: string; org?: string }[];
}): string {
  const parts: string[] = [];

  if (resume.summary) parts.push(resume.summary);

  if (resume.skills) {
    for (const [category, items] of Object.entries(resume.skills)) {
      parts.push(category, ...items);
    }
  }

  if (resume.softSkills?.length) {
    parts.push('Soft Skills', ...resume.softSkills);
  }

  for (const entry of resume.experience ?? []) {
    parts.push(entry.title ?? '', entry.org ?? '', ...entry.bullets);
  }

  for (const entry of resume.projects ?? []) {
    parts.push(entry.name ?? '', entry.techStack ?? '', ...entry.bullets);
  }

  for (const entry of resume.leadership ?? []) {
    parts.push(entry.role ?? '', entry.org ?? '', ...entry.bullets);
  }

  return parts.filter(Boolean).join(' ');
}
