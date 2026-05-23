import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { User } from './User';
import { ShareLink } from './ShareLink';

@Entity()
export class ResumeVersion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user) => user.resumeVersions)
  user!: User;

  @Column()
  name!: string;

  @Column('text')
  generatedTex!: string;

  @Column('text', { nullable: true })
  jobDescription!: string;

  @Column('simple-json', { nullable: true })
  contactInfo!: object;

  @OneToMany(() => ShareLink, (link) => link.version)
  shareLinks!: ShareLink[];

  @CreateDateColumn()
  createdAt!: Date;
}
