import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';
import {
  removePersistedParticipant,
  savePersistedParticipant,
  syncPersistentWhitelist,
} from '@/lib/persistentStore';

export const dynamic = 'force-dynamic';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const item = await prisma.whitelistParticipant.findUnique({
      where: { id: params.id },
    });

    await prisma.whitelistParticipant.delete({
      where: { id: params.id },
    });

    // Permanently remove from store file so it does not re-sync
    removePersistedParticipant(params.id);
    if (item?.email) {
      removePersistedParticipant(item.email);
    }

    return NextResponse.json({ success: true, message: 'Removed from whitelist' });
  } catch (error) {
    console.error('Delete whitelist entry error:', error);
    return NextResponse.json({ error: 'Failed to delete whitelist entry' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status } = await req.json();

    if (!['PENDING', 'CLAIMED', 'REVOKED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updated = await prisma.whitelistParticipant.update({
      where: { id: params.id },
      data: {
        status,
        ...(status === 'PENDING' ? { claimedAt: null, participantId: null } : {}),
      },
    });

    savePersistedParticipant(updated);

    return NextResponse.json({ success: true, participant: updated });
  } catch (error) {
    console.error('Update whitelist status error:', error);
    return NextResponse.json({ error: 'Failed to update whitelist status' }, { status: 500 });
  }
}
