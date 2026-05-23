import { AppDataSource } from '../db/dataSource';
import { ResumeSession } from '../db/entities/ResumeSession';
import { User } from '../db/entities/User';

export async function getOrCreateResumeSession(user: User): Promise<ResumeSession> {
  const sessionRepo = AppDataSource.getRepository(ResumeSession);

  const sessions = await sessionRepo.find({
    where: { user: { id: user.id } },
    order: { updatedAt: 'DESC' },
    take: 1,
    relations: ['user'],
  });

  if (sessions[0]) {
    return sessions[0];
  }

  const session = sessionRepo.create({ user });
  await sessionRepo.save(session);
  return session;
}
