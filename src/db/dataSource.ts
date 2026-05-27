import { DataSource } from 'typeorm';
import path from 'path';
import { User } from './entities/User';
import { ResumeSession } from './entities/ResumeSession';
import { ResumeVersion } from './entities/ResumeVersion';
import { ShareLink } from './entities/ShareLink';
import { ResumeGenerationEvent } from './entities/ResumeGenerationEvent';
import { PlatformStats } from './entities/PlatformStats';

export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: path.join(process.cwd(), 'data', 'git-apply.db'),
  synchronize: true,
  entities: [User, ResumeSession, ResumeVersion, ShareLink, ResumeGenerationEvent, PlatformStats],
});
