import type { UserRole, UserStatus } from '../generated/prisma/enums';

export interface PublicUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  createdAt: Date;
}

export type DatabaseUser = Omit<PublicUser, 'emailVerified'> & {
  emailVerifiedAt: Date | null;
};

export interface AuthenticatedRequestUser extends PublicUser {
  sessionId: string;
}

export const publicUserSelect = {
  id: true,
  email: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  bio: true,
  role: true,
  status: true,
  emailVerifiedAt: true,
  createdAt: true,
} as const;

export function toPublicUser(user: DatabaseUser | PublicUser): PublicUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    role: user.role,
    status: user.status,
    emailVerified:
      'emailVerified' in user ? user.emailVerified : user.emailVerifiedAt !== null,
    createdAt: user.createdAt,
  };
}
