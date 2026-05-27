import 'reflect-metadata';
import dotenv from 'dotenv';
import { AppDataSource } from '../db/dataSource';
import { ResumeVersion } from '../db/entities/ResumeVersion';
import { seedResumeCount } from '../lib/platformStats';

dotenv.config();

async function main() {
  await AppDataSource.initialize();

  const versionCount = await AppDataSource.getRepository(ResumeVersion).count();
  await seedResumeCount(versionCount);

  console.log(
    `Seeded platform stats with ${versionCount} saved resume version(s) as resumesGenerated baseline.`,
  );
  console.log('ATS pass rate and avg time will populate from new tailor events after deploy.');

  await AppDataSource.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
