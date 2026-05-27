import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class PlatformStats {
  @PrimaryColumn({ default: 1 })
  id!: number;

  @Column({ type: 'integer', default: 0 })
  resumesGenerated!: number;

  @Column({ type: 'integer', default: 0 })
  atsPassCount!: number;

  @Column({ type: 'integer', default: 0 })
  totalDurationMs!: number;

  @Column({ type: 'integer', default: 0 })
  durationCount!: number;
}
