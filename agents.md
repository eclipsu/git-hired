# git-hired — Agent Instructions

You are building a full-stack web application called **git-hired** that transforms a developer's GitHub activity into a polished, ATS-optimized resume. Users connect their GitHub account, select repositories, and the app analyzes commits and contributions to auto-generate resume bullet points. Users enrich these with a job description, existing resume, and free-text notes, then edit the generated LaTeX source in an Overleaf-style editor and download the compiled PDF.

---

## Tech Stack

- **Frontend**: React + Vite + TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Node.js + Express
- **Auth**: GitHub OAuth via `passport` + `passport-github2`
- **AI**: Google Gemini API — use `@google/generative-ai` SDK, model `gemini-1.5-flash` (free tier)
- **Resume export**: LaTeX → PDF via `node-latex` (wraps `pdflatex`) server-side
- **LaTeX editor**: `@uiw/react-codemirror` with LaTeX syntax highlighting for the Overleaf-style editor
- **Database**: SQLite via **TypeORM** with the `better-sqlite3` driver
- **File parsing**: `mammoth` (DOCX upload), `pdf-parse` (PDF upload)
- **Process manager (VPS)**: PM2
- **Reverse proxy (VPS)**: Nginx + Certbot (Let's Encrypt)

---

## App Flow & Screens

### 1. Connect (`/`)
- Landing page with a "Connect GitHub" button
- Triggers GitHub OAuth flow via `passport-github2`
- On success: fetch user profile (avatar, username, public repo list, contribution count)
- Store GitHub access token encrypted in the session and DB
- Redirect to `/analyze`

### 2. Analyze (`/analyze`)
- Display connected profile: avatar, username, stats (total repos, languages count, PRs merged)
- Show a selectable repo grid — each card shows: repo name, primary language, star count, commit count
- Multi-select; default to top 6 repos sorted by commit count
- "Analyze selected repos" triggers the server-side analysis pipeline

### 3. Analysis Pipeline (server-side, `POST /api/analyze`)
For each selected repo, call the GitHub API via Octokit to fetch:
- Commit history (messages, file counts, lines changed) — filter to authenticated user's commits only
- Languages breakdown
- Closed + merged PRs authored by the user (title + body)
- README content (base64 decode)

Aggregate all data per repo into a single string payload. Send to Gemini with this system prompt:

```
You are an expert technical resume writer. Given GitHub repository data including commit messages, PR titles, languages, and README content, generate 2–4 professional resume bullet points AND infer technical skills evidenced in the repo data.

Each bullet must:
- Start with a strong past-tense action verb (Built, Designed, Reduced, Implemented, Architected, Migrated, Automated, etc.)
- Include specific metrics where they can be reasonably inferred from the data (scale, % improvement, team size, time saved)
- Be written for ATS optimization — use industry-standard terminology
- Reflect genuine technical complexity; do not exaggerate
- Be 1–2 full sentences maximum

For the skills object, scan commit messages, PR titles/bodies, README, and language breakdown. Include ONLY categories where you find evidence. Explicitly look for these categories when present:
- Computer Science Concepts (data structures, algorithms, concurrency, distributed systems)
- Software Design Patterns (MVC, observer, factory, repository pattern)
- Documentation Practices (API docs, Swagger/OpenAPI, JSDoc, technical writing)
- Networking (TCP/IP, HTTP/REST, WebSockets, DNS, load balancing)
- Firmware (embedded C, RTOS, microcontrollers, device drivers)
- Kubernetes & Container Orchestration (Docker, K8s, Helm, ECS)
- Research Methodologies (literature review, experimental design, statistical analysis)
Also include standard categories: Languages, Frameworks & Libraries, Tools & Technologies.

Return ONLY valid JSON, no markdown fences, no preamble:
{
  "bullets": ["bullet 1", "bullet 2"],
  "skills": {
    "Languages": ["TypeScript"],
    "Computer Science Concepts": ["Data Structures"]
  }
}
```

Parse the JSON response. Store bullets and per-repo inferred skills in the DB session cache. Redirect to `/bullets`.

### 4. Review Bullets (`/bullets`)
- Render all generated bullets grouped by repo
- Each bullet has:
  - A checkbox (checked by default) to include/exclude from the resume
  - The bullet text
  - A **"Copy"** icon button that copies that single bullet to the clipboard (`navigator.clipboard.writeText`)
  - A **"Copy all"** button at the top that copies all currently checked bullets as a plain text list to the clipboard
- Toggling checkboxes updates state instantly (no server round-trip)
- "Continue →" saves selected bullets to the DB session and navigates to `/enrich`

### 5. Enrich (`/enrich`)
- **Upload existing resume** (optional): Accept PDF or DOCX. Parse server-side:
  - DOCX → `mammoth` → plain text
  - PDF → `pdf-parse` → plain text
  - Send extracted text to Gemini to pull out: prior job titles, employers, dates, education, certifications, skills not visible in GitHub
  - Store structured result in the DB session
- **Free-text notes** (optional): Textarea for anything else — internships, freelance work, soft skills, publications, conferences
- Both stored in the DB session alongside GitHub bullets
- "Continue →" navigates to `/tailor`

### 6. Tailor (`/tailor`)
- Textarea: "Paste a job description" (optional — if blank, generate a strong general-purpose resume)
- "Generate resume" button calls `POST /api/tailor`
- Server sends to Gemini:
  - All selected bullet points
  - Extracted prior experience (if resume uploaded)
  - User notes
  - Job description

System prompt:

```
You are an expert ATS resume optimizer and LaTeX resume author.

Given resume bullet points, optional prior experience, optional user notes, and an optional job description, do the following:

1. Write a professional summary (REQUIRED — never omit). If a job description is provided, include the exact job title from the JD in the summary (e.g. "Seeking a Software Intern role..." or woven naturally into the first sentence). If no JD is provided, write a general 2-sentence software engineering summary anyway.
2. If a job description is provided, rewrite and reorder bullets to maximize keyword match. Subtly rephrase to match the role's vocabulary without stuffing. Most relevant bullets first.
3. If an uploaded resume is provided, FULLY REWRITE every experience bullet for ATS impact — stronger action verbs, clearer metrics, industry-standard terminology. Do NOT copy uploaded resume bullets verbatim. Preserve all factual details (companies, titles, dates, institutions) exactly.
4. Produce a Technical Skills section grouped by category — include ALL inferred technologies from repo analysis and the uploaded resume, not just primary ones. Merge repo-inferred skills into the skills object.
5. Extract soft skills from user notes and the uploaded resume into a soft_skills array. Render as a Soft Skills subsection in LaTeX when present.
6. Incorporate any prior experience or education from the uploaded resume or user notes into the appropriate sections.

Length & density:
- Aim for 3–4 bullets per experience entry. Each bullet should be 1–2 full sentences.
- Expand the skills section comprehensively.
- Target 800–1000 words total across all sections.

Rules:
- Never invent metrics, companies, or experiences not present in the source data
- Preserve factual accuracy at all times

Return ONLY valid JSON, no markdown fences:
{
  "summary": "2-sentence professional summary tailored to the role.",
  "skills": {
    "Languages": ["Python", "TypeScript"],
    "Frameworks & Libraries": ["React"],
    "Computer Science Concepts": ["Data Structures"],
    "Software Design Patterns": ["MVC"]
  },
  "soft_skills": ["Communication", "Team Collaboration"],
  "experience": [
    {
      "title": "Software Engineer",
      "org": "Company Name",
      "dates": "Jun 2024 -- Aug 2024",
      "location": "City, State",
      "bullets": ["bullet 1", "bullet 2", "bullet 3"]
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "techStack": "React, Node.js",
      "dates": "Jan 2024",
      "bullets": ["bullet 1", "bullet 2"]
    }
  ],
  "education": [{ "degree": "...", "institution": "...", "dates": "..." }]
}
```

Pass aggregated repo-inferred skills from the analyze cache into the tailor prompt. Store the structured JSON in the DB session. Generate the LaTeX source from it (see LaTeX Generation below). Redirect to `/editor`.

### 7. LaTeX Editor (`/editor`) — Overleaf-style

This is the core differentiating screen. Build it as a two-panel split view:

**Left panel — LaTeX source editor:**
- Use `@uiw/react-codemirror` with `@codemirror/lang-legacy-modes` for LaTeX syntax highlighting
- Load the server-generated `.tex` source as the initial value
- User can freely edit the raw LaTeX — font, layout, section order, anything
- Toolbar buttons:
  - **Compile** — sends current editor content to `POST /api/compile` and refreshes the right panel
  - **Reset** — restores the originally generated `.tex` source
  - **Copy LaTeX** — copies the full `.tex` source to clipboard

**Right panel — PDF preview:**
- Render the compiled PDF in an `<iframe>` using the object URL returned from `/api/compile`
- Show a loading spinner while compiling
- On compile error, show the LaTeX error output in a dismissable red banner below the editor

**Top bar:**
- "← Re-tailor" link back to `/tailor`
- **"Download PDF"** button — triggers download of the compiled PDF
- **"Copy all bullets"** button — copies just the bullet points (plain text) to clipboard

---

## LaTeX Generation (Server-side)

On `POST /api/tailor`, after getting the structured JSON from Gemini, generate a `.tex` file using string templating (no npm LaTeX package needed — just build the string directly).

Use the `moderncv` LaTeX class for a clean, professional look. Install it on the VPS: `sudo apt install texlive-full` (includes moderncv and pdflatex).

### Template structure:

```latex
\documentclass[11pt, letterpaper, sans]{moderncv}
\moderncvstyle{classic}
\moderncvcolor{blue}
\usepackage[scale=0.85]{geometry}
\usepackage{enumitem}

% Personal info
\name{{{firstName}}}{{{lastName}}}
\email{{{email}}}
\social[github]{{{githubUsername}}}

\begin{document}
\makecvtitle

\section{Professional Summary}
{{summary}}

\section{Technical Skills}
{{#each skillCategories}}
\cvitem{\textbf{ {{category}} }}{ {{skills}} }
{{/each}}
{{#if softSkills}}
\cvitem{\textbf{Soft Skills}}{ {{softSkills}} }
{{/if}}

\section{Experience}
{{#each experience}}
\cventry{ {{dates}} }{ {{title}} }{ {{org}} }{}{}{ 
  \begin{itemize}[leftmargin=*]
    {{#each bullets}}
    \item {{this}}
    {{/each}}
  \end{itemize}
}
{{/each}}

{{#if education}}
\section{Education}
{{#each education}}
\cventry{ {{year}} }{ {{degree}} }{ {{institution}} }{}{}{}
{{/each}}
{{/if}}

\end{document}
```

Build this with a simple template function — replace `{{variables}}` with escaped LaTeX values. Always escape special LaTeX characters in user content: `& % $ # _ { } ~ ^ \`

### Compile endpoint:

```typescript
// POST /api/compile
// Body: { tex: string }
// Returns: PDF binary

import latex from 'node-latex';
import { Readable } from 'stream';

app.post('/api/compile', async (req, res) => {
  const { tex } = req.body;
  const input = Readable.from([tex]);
  const pdf = latex(input, { errorLogs: true });

  const chunks: Buffer[] = [];
  pdf.on('data', chunk => chunks.push(chunk));
  pdf.on('end', () => {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="resume.pdf"');
    res.send(Buffer.concat(chunks));
  });
  pdf.on('error', err => {
    res.status(422).json({ error: err.message });
  });
});
```

Install: `npm install node-latex`
VPS requirement: `sudo apt install texlive-full` (needed for pdflatex and moderncv)

---

## Database — TypeORM + SQLite

Use **TypeORM** with the `better-sqlite3` driver. No Prisma.

Install: `npm install typeorm better-sqlite3 reflect-metadata`
Add to `tsconfig.json`: `"experimentalDecorators": true, "emitDecoratorMetadata": true`

### Data Source config:

```typescript
// src/db/dataSource.ts
import { DataSource } from 'typeorm';
import { User } from './entities/User';
import { ResumeSession } from './entities/ResumeSession';

export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: './data/git-hired.db',
  synchronize: true, // auto-creates tables in dev; use migrations in prod
  entities: [User, ResumeSession],
});
```

### Entities:

```typescript
// src/db/entities/User.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { ResumeSession } from './ResumeSession';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  githubId: string;

  @Column()
  username: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column()
  accessToken: string; // store encrypted — see Security section

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => ResumeSession, session => session.user)
  resumeSessions: ResumeSession[];
}
```

```typescript
// src/db/entities/ResumeSession.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';

@Entity()
export class ResumeSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, user => user.resumeSessions)
  user: User;

  @Column('simple-json', { nullable: true })
  selectedRepos: string[];

  @Column('simple-json', { nullable: true })
  rawBullets: Record<string, string[]>; // { repoName: [bullets] }

  @Column('simple-json', { nullable: true })
  selectedBullets: { text: string; repo: string; included: boolean }[];

  @Column('text', { nullable: true })
  uploadedResumeText: string;

  @Column('text', { nullable: true })
  userNotes: string;

  @Column('text', { nullable: true })
  jobDescription: string;

  @Column('simple-json', { nullable: true })
  tailoredResume: object; // structured JSON from Gemini

  @Column('text', { nullable: true })
  generatedTex: string; // the .tex source string

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

Returning users: on login, load their most recent `ResumeSession` and pre-fill the tailor screen so they can generate a new resume without starting from scratch.

---

## Gemini API Integration

Install: `npm install @google/generative-ai`

```typescript
// src/lib/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export async function ask(prompt: string): Promise<string> {
  const result = await model.generateContent(prompt);
  return result.response.text();
}
```

Always instruct Gemini to return raw JSON with no markdown fences. Parse with `JSON.parse()`. Wrap in try/catch and retry once if parsing fails.

---

## GitHub API Usage

Install: `npm install @octokit/rest`

```typescript
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({ auth: userAccessToken });

// User's commits in a repo
const commits = await octokit.repos.listCommits({
  owner, repo, author: username, per_page: 100
});

// Languages
const langs = await octokit.repos.listLanguages({ owner, repo });

// Merged PRs by user
const prs = await octokit.pulls.list({
  owner, repo, state: 'closed', per_page: 50
});
const mergedByUser = prs.data.filter(
  pr => pr.user?.login === username && pr.merged_at !== null
);

// README
const readme = await octokit.repos.getReadme({ owner, repo });
const readmeText = Buffer.from(readme.data.content, 'base64').toString('utf-8');
```

Cache GitHub responses in the `ResumeSession` to avoid re-fetching on page reload. Respect rate limits — add a 100ms delay between repo fetches.

---

## Security

- **Encrypt access tokens at rest**: use `crypto` (Node built-in) with AES-256-GCM. Store the IV + encrypted token. Decrypt only when making GitHub API calls.
- **Sessions**: use `express-session` with `connect-sqlite3` store — sessions persist across server restarts on the VPS.
- **CSRF**: enable `csurf` middleware on all state-changing POST routes.
- **Helmet**: add `helmet()` middleware for secure HTTP headers.

---

## Clipboard Copy Implementation

Use the Web Clipboard API throughout. Wrap in a helper:

```typescript
// src/utils/clipboard.ts
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    return true;
  }
}
```

Use this in:
- Individual bullet "Copy" icon button → copies that bullet's text
- "Copy all bullets" → joins all checked bullets with `\n• ` prefix
- "Copy LaTeX" in the editor toolbar → copies full `.tex` source
- All copy buttons show a brief "Copied ✓" confirmation state for 1.5 seconds after clicking

---

## Environment Variables

```bash
# GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=https://yourdomain.com/auth/github/callback

# Gemini
GEMINI_API_KEY=

# Session
SESSION_SECRET=

# Encryption key for access tokens (32 bytes hex)
ENCRYPTION_KEY=

# App
PORT=3000
NODE_ENV=production
```

---

## VPS Deployment

```bash
# Install system dependencies
sudo apt update
sudo apt install -y texlive-full nodejs npm nginx certbot python3-certbot-nginx

# Install PM2
npm install -g pm2

# Run the app
pm2 start dist/index.js --name git-hired
pm2 save
pm2 startup

# Nginx config: proxy port 3000, enable SSL with certbot
```

Nginx config:
```nginx
server {
  server_name yourdomain.com;
  location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

Store the SQLite database at `/home/user/git-hired/data/git-hired.db`. Add a daily cron backup:
```bash
0 2 * * * cp /home/user/git-hired/data/git-hired.db /home/user/backups/git-hired-$(date +\%Y\%m\%d).db
```

---

## Key UX Details

- Analysis screen: show step-by-step progress text while fetching GitHub data and calling Gemini ("Fetching commits...", "Reading PRs...", "Writing bullet points...")
- Bullet toggles must update instantly — no server round-trip, pure React state
- Every copy button shows "Copied ✓" for 1.5s then reverts — use a `useState` timeout pattern
- The LaTeX editor and PDF preview are the hero of the app — give them 90% of the viewport height, clean split-panel layout
- Compile errors show as a dismissable red banner with the raw LaTeX error log — don't hide errors from the user
- Returning users land on a dashboard at `/dashboard` showing past sessions with "Re-tailor" and "Open editor" buttons per session

---

## What NOT to Do

- Do not use Prisma — use TypeORM with better-sqlite3 only
- Do not use the Anthropic SDK — use `@google/generative-ai` (Gemini) only
- Do not generate DOCX — export format is PDF compiled from LaTeX only
- Do not store GitHub access tokens in plaintext — always encrypt with AES-256-GCM
- Do not block the UI during Gemini calls or LaTeX compilation — always show a loading state
- Do not invent metrics, employers, or experiences not present in the source data
- Do not use markdown fences in Gemini prompts — always instruct it to return raw JSON
- Do not skip the LaTeX character escaping step — unescaped `&`, `%`, `$`, `#`, `_` will crash pdflatex