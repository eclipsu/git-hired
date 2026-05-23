import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { ResumeSession } from './ResumeSession';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  githubId!: string;

  @Column()
  username!: string;

  @Column({ nullable: true })
  avatarUrl!: string;

  @Column()
  accessToken!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => ResumeSession, (session) => session.user)
  resumeSessions!: ResumeSession[];
}
