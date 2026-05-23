import type { User as UserEntity } from '../db/entities/User';

declare global {
  namespace Express {
    interface User extends UserEntity {}
  }
}

export {};
