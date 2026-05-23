import { execSync } from 'child_process';

const INSTALL_HINT =
  'Install LaTeX: sudo apt install -y texlive-latex-base texlive-latex-extra texlive-fonts-recommended texlive-fonts-extra';

export function isPdflatexAvailable(): boolean {
  try {
    execSync('command -v pdflatex', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function pdflatexErrorMessage(): string {
  return `pdflatex is not installed on this machine. ${INSTALL_HINT}`;
}
