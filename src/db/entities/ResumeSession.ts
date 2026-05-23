import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './User';
import type { CachedRepo, RepoAnalysisCache } from '../../lib/repoCache';

@Entity()
export class ResumeSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user) => user.resumeSessions)
  user!: User;

  @Column('simple-json', { nullable: true })
  cachedRepos!: CachedRepo[];

  @Column({ type: 'datetime', nullable: true })
  reposCachedAt!: Date | null;

  @Column('simple-json', { nullable: true })
  repoAnalysisCache!: RepoAnalysisCache;

  @Column('simple-json', { nullable: true })
  selectedRepos!: string[];

  @Column('simple-json', { nullable: true })
  rawBullets!: Record<string, string[]>;

  @Column('simple-json', { nullable: true })
  selectedBullets!: { text: string; repo: string; included: boolean }[];

  @Column('text', { nullable: true })
  uploadedResumeText!: string;

  @Column('text', { nullable: true })
  uploadedResumeFilename!: string;

  @Column('text', { nullable: true })
  userNotes!: string;

  @Column('text', { nullable: true })
  jobDescription!: string;

  @Column('simple-json', { nullable: true })
  contactInfo!: {
    fullName: string;
    address: string;
    phone: string;
    email: string;
    linkedin: string;
    github: string;
  };

  @Column('simple-json', { nullable: true })
  tailoredResume!: object;

  @Column('text', { nullable: true })
  generatedTex!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
