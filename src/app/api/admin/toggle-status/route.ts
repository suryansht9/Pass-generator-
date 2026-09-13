import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function PATCH(req: NextRequest) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_CACHE_HEADERS });
    }

    const { id, type, value } = await req.json();

    if (!id || !['checkedIn', 'foodReceived'].includes(type) || typeof value !== 'boolean') {
      return NextResponse.json({ error: 'Invalid toggle parameters' }, { status: 400, headers: NO_CACHE_HEADERS });
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

    return NextResponse.json({ success: true, type, value }, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('Toggle status error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update status' }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
