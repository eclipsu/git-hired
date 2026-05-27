import 'reflect-metadata';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import session from 'express-session';
import connectSqlite3 from 'connect-sqlite3';
import passport from 'passport';
import path from 'path';
import fs from 'fs';
import { AppDataSource } from './db/dataSource';
import { User } from './db/entities/User';
import { GeminiQuotaError } from './lib/gemini';
import { configurePassport } from './lib/passport';
import authRoutes from './routes/auth';
import reposRoutes from './routes/repos';
import analyzeRoutes from './routes/analyze';
import parseResumeRoutes from './routes/parseResume';
import extractProfileRoutes from './routes/extractProfile';
import sessionRoutes from './routes/session';
import tailorRoutes from './routes/tailor';
import compileRoutes from './routes/compile';
import versionsRoutes from './routes/versions';
import shareRoutes from './routes/share';
import dashboardRoutes from './routes/dashboard';
import publicStatsRoutes from './routes/publicStats';
import { isPdflatexAvailable, pdflatexErrorMessage } from './lib/pdflatex';

dotenv.config();

const REQUIRED_ENV = [
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'GITHUB_CALLBACK_URL',
  'SESSION_SECRET',
  'ENCRYPTION_KEY',
  'GEMINI_API_KEY',
  'FRONTEND_URL',
] as const;

function assertRequiredEnv(): void {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]?.trim());
  if (missing.length === 0) return;

  console.error('\n[env] Missing required environment variables:\n');
  for (const key of missing) {
    console.error(`  - ${key}`);
  }
  console.error(
    '\nOn EC2: cp .env.production.example .env && nano .env\n' +
      'Then restart: docker compose --profile prod up -d --build\n',
  );
  process.exit(1);
}

const SQLiteStore = connectSqlite3(session);
const PORT = Number(process.env.PORT) || 4000;
const isProduction = process.env.NODE_ENV === 'production';

async function main() {
  assertRequiredEnv();

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  await AppDataSource.initialize();
  console.log('Database connected');

  configurePassport();

  const app = express();

  // Required when behind Vercel rewrites (OAuth cookies + secure session)
  if (isProduction) {
    app.set('trust proxy', 1);
  }

  app.use(helmet());
  app.use(express.json());

  app.use(
    session({
      store: new SQLiteStore({
        db: 'sessions.db',
        dir: dataDir,
      }) as session.Store,
      secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: isProduction,
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/me', (req: Request, res: Response) => {
    if (!req.isAuthenticated() || !req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = req.user as User;
    res.json({
      githubId: user.githubId,
      username: user.username,
      avatarUrl: user.avatarUrl,
    });
  });

  app.use('/auth', authRoutes);
  app.use('/api/repos', reposRoutes);
  app.use('/api/analyze', analyzeRoutes);
  app.use('/api/parse-resume', parseResumeRoutes);
  app.use('/api/extract-profile', extractProfileRoutes);
  app.use('/api/session', sessionRoutes);
  app.use('/api/tailor', tailorRoutes);
  app.use('/api/compile', compileRoutes);
  app.use('/api/versions', versionsRoutes);
  app.use('/api/share', shareRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/stats', publicStatsRoutes);

  app.use((err: Error, _req: Request, res: Response, _next: () => void) => {
    console.error(err);
    if (err instanceof GeminiQuotaError) {
      res.status(429).json({
        error: err.message,
        retryAfterMs: err.retryAfterMs ?? null,
      });
      return;
    }
    const message = err.message.includes('GEMINI_API_KEY')
      ? err.message
      : err.message.includes('GoogleGenerativeAI') && err.message.includes('429')
        ? 'Gemini API rate limit exceeded. Please wait a minute and try again.'
        : err.message.includes('GoogleGenerativeAI')
          ? `Gemini API error: ${err.message}`
          : err.message || 'Internal server error';
    res.status(500).json({ error: message });
  });

  if (isProduction) {
    const clientDist = path.join(__dirname, '../client/dist');
    if (fs.existsSync(clientDist)) {
      app.use(express.static(clientDist));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(clientDist, 'index.html'));
      });
    }
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    if (!isPdflatexAvailable()) {
      console.warn(`[warn] ${pdflatexErrorMessage()}`);
    }
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
