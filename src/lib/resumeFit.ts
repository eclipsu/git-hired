import pdfParse from 'pdf-parse';
import { ask } from './gemini';
import { ContactInfo, generateLatex, TailoredResume } from './latex';
import { compileTexToPdf } from './latexCompile';
import { isPdflatexAvailable } from './pdflatex';
import {
  buildExpandResumePrompt,
  buildTrimResumePrompt,
  countResumeBullets,
  isResumeSparse,
  parseFitResumeResponse,
} from './prompts/fitResume';

const MAX_FIT_ITERATIONS = 3;

export interface FitResumeResult {
  resume: TailoredResume;
  tex: string;
  pageCount: number;
  fitIterations: number;
  fitWarning: string | null;
  skipped: boolean;
}

export async function getPageCount(pdf: Buffer): Promise<number> {
  const parsed = await pdfParse(pdf);
  return parsed.numpages;
}

async function compileAndCountPages(tex: string): Promise<number> {
  const pdf = await compileTexToPdf(tex);
  return getPageCount(pdf);
}

export async function fitResumeToOnePage(
  resume: TailoredResume,
  contact: ContactInfo,
): Promise<FitResumeResult> {
  if (!isPdflatexAvailable()) {
    console.warn('[resumeFit] pdflatex unavailable — skipping page-fit loop');
    const tex = generateLatex(resume, contact);
    return {
      resume,
      tex,
      pageCount: 1,
      fitIterations: 0,
      fitWarning: null,
      skipped: true,
    };
  }

  let current = resume;
  let tex = generateLatex(current, contact);
  let pageCount = 1;
  let fitIterations = 0;
  let fitWarning: string | null = null;

  try {
    pageCount = await compileAndCountPages(tex);
  } catch (err) {
    console.warn('[resumeFit] Initial compile failed:', err instanceof Error ? err.message : err);
    return {
      resume: current,
      tex,
      pageCount: 1,
      fitIterations: 0,
      fitWarning: null,
      skipped: true,
    };
  }

  while (pageCount > 1 && fitIterations < MAX_FIT_ITERATIONS) {
    fitIterations += 1;
    console.log(`[resumeFit] Trim pass ${fitIterations}: ${pageCount} pages`);

    const prompt = buildTrimResumePrompt(current, pageCount);
    const text = await ask(prompt);
    current = parseFitResumeResponse(text);
    tex = generateLatex(current, contact);

    try {
      pageCount = await compileAndCountPages(tex);
    } catch (err) {
      console.warn('[resumeFit] Compile failed after trim:', err instanceof Error ? err.message : err);
      break;
    }
  }

  if (pageCount > 1) {
    fitWarning = `Resume still spans ${pageCount} pages after ${fitIterations} trim pass(es). Remove a project in Bullets and re-tailor.`;
  } else if (isResumeSparse(current) && fitIterations < MAX_FIT_ITERATIONS) {
    fitIterations += 1;
    console.log('[resumeFit] Expand pass: sparse content on one page');

    const prompt = buildExpandResumePrompt(current, countResumeBullets(current));
    const text = await ask(prompt);
    const expanded = parseFitResumeResponse(text);
    const expandedTex = generateLatex(expanded, contact);

    try {
      const expandedPages = await compileAndCountPages(expandedTex);
      if (expandedPages === 1) {
        current = expanded;
        tex = expandedTex;
        pageCount = 1;
      }
    } catch (err) {
      console.warn('[resumeFit] Compile failed after expand:', err instanceof Error ? err.message : err);
    }
  }

  return {
    resume: current,
    tex,
    pageCount,
    fitIterations,
    fitWarning,
    skipped: false,
  };
}
