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

    const now = new Date();
    const updateData: any = { [type]: value };

    if (type === 'checkedIn') {
      updateData.checkedInAt = value ? now : null;
    } else if (type === 'foodReceived') {
      updateData.foodReceivedAt = value ? now : null;
    }

    // Update WhitelistParticipant
    await prisma.whitelistParticipant.updateMany({
      where: {
        OR: [{ id }, { participantId: id }],
      },
      data: updateData,
    });

    // Update Participant table
    await prisma.participant.updateMany({
      where: {
        OR: [{ id }, { participantId: id }],
      },
      data: updateData,
    });

    return NextResponse.json({ success: true, type, value });
  } catch (error: any) {
    console.error('Toggle status error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update status' }, { status: 500 });
  }
}
