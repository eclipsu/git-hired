import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from './User';

@Entity()
export class ResumeGenerationEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User)
  user!: User;

  @Column({ type: 'integer', nullable: true })
  durationMs!: number | null;

  @Column({ type: 'integer' })
  pageCount!: number;

  @Column({ type: 'integer', default: 0 })
  fitIterations!: number;

  @Column({ default: false })
  hasJobDescription!: boolean;

  @Column({ type: 'integer', default: 0 })
  atsMatchPercent!: number;

  @Column({ default: false })
  passedAts!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
