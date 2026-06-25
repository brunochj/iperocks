import { getAuthUserFromAuthHeader, resolveDbUser } from '@/lib/server/auth-user';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

function metadataString(
  metadata: Record<string, unknown> | undefined,
  key: string
): string | null {
  const value = metadata?.[key];
  return typeof value === 'string' ? value : null;
}

export async function POST(req: Request) {
  const user = await getAuthUserFromAuthHeader(req.headers.get('authorization'));
  if (!user?.email) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const rulesData = {
    rulesAccepted: true,
    rulesAcceptedAt: new Date(),
    rulesVersion: '1.0',
  };

  const existingUser = await resolveDbUser(user);
  let updatedUser = existingUser;

  if (existingUser) {
    updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: rulesData,
    });
  } else {
    updatedUser = await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        name:
          metadataString(user.user_metadata, 'name') ??
          metadataString(user.user_metadata, 'full_name'),
        image:
          metadataString(user.user_metadata, 'avatar_url') ??
          metadataString(user.user_metadata, 'picture'),
        ...rulesData,
      },
    });
  }

  return NextResponse.json({
    success: true,
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      username: updatedUser.username,
      image: updatedUser.image,
      rulesAccepted: updatedUser.rulesAccepted,
    },
  });
}
