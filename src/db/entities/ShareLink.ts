import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { ResumeVersion } from './ResumeVersion';

@Entity()
export class ShareLink {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => ResumeVersion, (version) => version.shareLinks, { onDelete: 'CASCADE' })
  version!: ResumeVersion;

  @Column({ unique: true })
  code!: string;

  @Column({ default: 0 })
  clickCount!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
