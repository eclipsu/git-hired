const LATEX_SPECIAL = /[&%$#_{}~^\\]/g;

export function escapeLatex(value: string): string {
  return value.replace(LATEX_SPECIAL, (char) => {
    switch (char) {
      case '\\':
        return '\\textbackslash{}';
      case '~':
        return '\\textasciitilde{}';
      case '^':
        return '\\textasciicircum{}';
      default:
        return `\\${char}`;
    }
  });
}

export interface TailoredResume {
  summary: string;
  skills: Record<string, string[]>;
  experience: {
    title: string;
    org: string;
    dates: string;
    bullets: string[];
  }[];
  education?: { degree: string; institution: string; year: string }[];
}

export function generateLatex(
  resume: TailoredResume,
  githubUsername: string,
): string {
  const skillBlocks = Object.entries(resume.skills ?? {})
    .map(
      ([category, skills]) =>
        `\\cvitem{\\textbf{${escapeLatex(category)}}}{${escapeLatex(skills.join(', '))}}`,
    )
    .join('\n');

  const experienceBlocks = (resume.experience ?? [])
    .map(
      (entry) => `\\cventry{${escapeLatex(entry.dates)}}{${escapeLatex(entry.title)}}{${escapeLatex(entry.org)}}{}{}{
  \\begin{itemize}[leftmargin=*]
${entry.bullets.map((b) => `    \\item ${escapeLatex(b)}`).join('\n')}
  \\end{itemize}
}`,
    )
    .join('\n\n');

  const educationBlocks = (resume.education ?? [])
    .map(
      (edu) =>
        `\\cventry{${escapeLatex(edu.year)}}{${escapeLatex(edu.degree)}}{${escapeLatex(edu.institution)}}{}{}{}`,
    )
    .join('\n');

  const educationSection =
    educationBlocks.length > 0
      ? `\\section{Education}\n${educationBlocks}\n`
      : '';

  return `\\documentclass[11pt, letterpaper, sans]{moderncv}
\\moderncvstyle{classic}
\\moderncvcolor{blue}
\\usepackage[scale=0.85]{geometry}
\\usepackage{enumitem}

\\name{}{}
\\social[github]{${escapeLatex(githubUsername)}}

\\begin{document}
\\makecvtitle

\\section{Professional Summary}
${escapeLatex(resume.summary)}

\\section{Technical Skills}
${skillBlocks}

\\section{Experience}
${experienceBlocks}

${educationSection}\\end{document}`;
}
