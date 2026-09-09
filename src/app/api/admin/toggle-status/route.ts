import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, type, value } = await req.json();

    if (!id || !['checkedIn', 'foodReceived'].includes(type) || typeof value !== 'boolean') {
      return NextResponse.json({ error: 'Invalid toggle parameters' }, { status: 400 });
    }

    // Update WhitelistParticipant
    const updatedWhitelist = await prisma.whitelistParticipant.updateMany({
      where: {
        OR: [{ id }, { participantId: id }],
      },
      data: {
        [type]: value,
      },
    });

    // Update Participant table
    await prisma.participant.updateMany({
      where: {
        OR: [{ id }, { participantId: id }],
      },
      data: {
        [type]: value,
      },
    });

    return NextResponse.json({ success: true, type, value });
  } catch (error: any) {
    console.error('Toggle status error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update status' }, { status: 500 });
  }
}
