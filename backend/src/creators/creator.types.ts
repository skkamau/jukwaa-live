export const creatorSelect = {
  id: true,
  status: true,
  verifiedAt: true,
  createdAt: true,
  channel: {
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      bannerUrl: true,
      status: true,
      createdAt: true,
    },
  },
} as const;

export interface CreatorResponse {
  id: string;
  status: string;
  verified: boolean;
  createdAt: Date;
  channel: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    bannerUrl: string | null;
    status: string;
    createdAt: Date;
  } | null;
}

export function toCreatorResponse(creator: {
  id: string;
  status: string;
  verifiedAt: Date | null;
  createdAt: Date;
  channel: CreatorResponse['channel'];
}): CreatorResponse {
  return {
    id: creator.id,
    status: creator.status,
    verified: creator.verifiedAt !== null,
    createdAt: creator.createdAt,
    channel: creator.channel,
  };
}
