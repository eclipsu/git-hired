import fs from 'fs';
import path from 'path';

/** App root: one level above `dist/` (or `src/` in ts-node). */
export function getAppRoot(): string {
  return path.resolve(__dirname, '..', '..');
}

export function getTexDir(): string {
  return path.join(getAppRoot(), 'tex');
}

export function getTexmfHome(): string {
  return path.join(getTexDir(), 'texmf');
}

export function getResumeTemplatePath(): string {
  return path.join(getTexDir(), 'resume-template.tex');
}

const FONTAWESOME_TFM = path.join(
  getTexmfHome(),
  'fonts/tfm/public/fontawesome5/fa5free2solid.tfm',
);
const FONTAWESOME_MAP = path.join(
  getTexmfHome(),
  'fonts/map/dvips/fontawesome5/fontawesome5.map',
);

export function getFontAwesomeAssetStatus(): {
  texmfHome: string;
  ok: boolean;
  missing: string[];
} {
  const texmfHome = getTexmfHome();
  const missing: string[] = [];

  if (!fs.existsSync(texmfHome)) {
    missing.push(texmfHome);
  }
  if (!fs.existsSync(FONTAWESOME_TFM)) {
    missing.push(FONTAWESOME_TFM);
  }
  if (!fs.existsSync(FONTAWESOME_MAP)) {
    missing.push(FONTAWESOME_MAP);
  }

  return { texmfHome, ok: missing.length === 0, missing };
}

export function configureTexmfHome(): string | null {
  const { texmfHome, ok } = getFontAwesomeAssetStatus();
  if (!ok) {
    return null;
  }
  process.env.TEXMFHOME = texmfHome;
  return texmfHome;
}
