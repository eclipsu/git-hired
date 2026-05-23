import { DataSource } from 'typeorm';
import path from 'path';
import { User } from './entities/User';
import { ResumeSession } from './entities/ResumeSession';

export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: path.join(process.cwd(), 'data', 'git-hired.db'),
  synchronize: true,
  entities: [User, ResumeSession],
});
