import passport from 'passport';
import { Strategy as GitHubStrategy, Profile } from 'passport-github2';
import { AppDataSource } from '../db/dataSource';
import { User } from '../db/entities/User';
import { encrypt } from '../utils/crypto';

export function configurePassport(): void {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        callbackURL: process.env.GITHUB_CALLBACK_URL!,
        scope: ['read:user', 'repo'],
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done: (error: Error | null, user?: User | false) => void,
      ) => {
        try {
          const userRepo = AppDataSource.getRepository(User);
          const githubId = String(profile.id);
          const encryptedToken = encrypt(_accessToken);

          let user = await userRepo.findOne({ where: { githubId } });

          if (user) {
            user.accessToken = encryptedToken;
            user.username = profile.username ?? user.username;
            user.avatarUrl = profile.photos?.[0]?.value ?? user.avatarUrl;
          } else {
            user = userRepo.create({
              githubId,
              username: profile.username ?? 'unknown',
              avatarUrl: profile.photos?.[0]?.value ?? '',
              accessToken: encryptedToken,
            });
          }

          await userRepo.save(user);
          done(null, user);
        } catch (err) {
          done(err as Error);
        }
      },
    ),
  );

  passport.serializeUser((user, done) => {
    done(null, (user as User).id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await AppDataSource.getRepository(User).findOne({ where: { id } });
      done(null, user ?? undefined);
    } catch (err) {
      done(err);
    }
  });
}
