import { TailoredResume } from '../latex';
import { parseTailorResponse } from './tailor';

export function buildTrimResumePrompt(resume: TailoredResume, pageCount: number): string {
  return `You are an ATS resume editor. The resume below compiled to ${pageCount} PDF pages but MUST fit on exactly ONE US letter page (11pt Jake LaTeX template).

Trim content in this priority order (stop once it would fit one page):
1. Remove "leadership" section entirely if present
2. Drop lowest-priority project(s) — keep max 3 projects
3. Reduce bullets to max 2 per experience entry and max 2 per project
4. Shorten the longest bullets to one tight sentence each
5. Merge or remove minor skill categories; keep 3–4 categories max
6. Remove soft_skills if still too long

Rules:
- Never invent facts, companies, dates, or metrics
- Preserve all education entries and contact-relevant experience titles/dates
- Keep JSON schema identical to tailor output
- Return ONLY valid JSON, no markdown fences

Current resume JSON:
${JSON.stringify(resume, null, 2)}`;
}

export function buildExpandResumePrompt(resume: TailoredResume, bulletCount: number): string {
  return `You are an ATS resume editor. The resume below fits on one page but is too sparse (${bulletCount} total bullets). Expand it to better fill the page WITHOUT exceeding one page.

Add content in this priority order:
1. Add one strong bullet to the top 1–2 projects (engineering decisions, not file counts)
2. Expand skill categories with evidenced technologies from existing bullets
3. Add soft_skills if supported by source content
4. Lengthen thin experience bullets with concrete detail (one sentence each)

Rules:
- Never invent companies, dates, or achievements
- Max 3 bullets per entry after expansion
- Max 4 projects total
- Return ONLY valid JSON, no markdown fences

Current resume JSON:
${JSON.stringify(resume, null, 2)}`;
}

export function parseFitResumeResponse(text: string): TailoredResume {
  return parseTailorResponse(text);
}

export function countResumeBullets(resume: TailoredResume): number {
  let n = 0;
  for (const e of resume.experience ?? []) n += e.bullets?.length ?? 0;
  for (const p of resume.projects ?? []) n += p.bullets?.length ?? 0;
  for (const l of resume.leadership ?? []) n += l.bullets?.length ?? 0;
  return n;
}

export function isResumeSparse(resume: TailoredResume): boolean {
  return countResumeBullets(resume) < 8;
}
