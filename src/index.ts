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
import { configurePassport } from './lib/passport';
import authRoutes from './routes/auth';
import reposRoutes from './routes/repos';
import analyzeRoutes from './routes/analyze';
import parseResumeRoutes from './routes/parseResume';
import tailorRoutes from './routes/tailor';
import compileRoutes from './routes/compile';
import { isPdflatexAvailable, pdflatexErrorMessage } from './lib/pdflatex';

dotenv.config();

const SQLiteStore = connectSqlite3(session);
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

async function main() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  await AppDataSource.initialize();
  console.log('Database connected');

  configurePassport();

  const app = express();

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
  app.use('/api/tailor', tailorRoutes);
  app.use('/api/compile', compileRoutes);

  app.use((err: Error, _req: Request, res: Response, _next: () => void) => {
    console.error(err);
    const message = err.message.includes('GEMINI_API_KEY')
      ? err.message
      : err.message.includes('GoogleGenerativeAI')
        ? `Gemini API error: ${err.message}`
        : err.message || 'Internal server error';
    res.status(500).json({ error: message });
  });

  if (isProduction) {
    const clientDist = path.join(__dirname, '../client/dist');
    app.use(express.static(clientDist));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
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
