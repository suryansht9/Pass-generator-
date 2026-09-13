import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { foodPassId } = body;

    if (!foodPassId || !foodPassId.trim()) {
      return NextResponse.json(
        { status: 'INVALID', error: 'Food Pass ID is required.' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const normalizedPassId = foodPassId.trim().toUpperCase();

    // 1. Search WhitelistParticipant table
    let whitelistRecord = await prisma.whitelistParticipant.findFirst({
      where: {
        foodPassId: { equals: normalizedPassId },
      },
    });

    // 2. Search Participant table
    let participantRecord = await prisma.participant.findFirst({
      where: {
        foodPassId: { equals: normalizedPassId },
      },
    });

    if (!whitelistRecord && !participantRecord) {
      // Case-insensitive fallback search
      const allWhitelist = await prisma.whitelistParticipant.findMany({ where: { foodPassGenerated: true } });
      whitelistRecord = allWhitelist.find((w) => w.foodPassId?.trim().toUpperCase() === normalizedPassId) || null;

      const allParticipants = await prisma.participant.findMany({ where: { foodPassGenerated: true } });
      participantRecord = allParticipants.find((p) => p.foodPassId?.trim().toUpperCase() === normalizedPassId) || null;
    }

    // 3. Reject if Food Pass ID does not exist in either table
    if (!whitelistRecord && !participantRecord) {
      return NextResponse.json(
        { status: 'INVALID', error: 'Invalid Food Pass ID. Pass record not found in database.' },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    const status = whitelistRecord?.status || participantRecord?.status;
    const fullName = whitelistRecord?.fullName || participantRecord?.fullName || 'Participant';
    const email = whitelistRecord?.email || participantRecord?.email || null;
    const teamName = whitelistRecord?.teamName || participantRecord?.teamName || '—';
    const collegeName = whitelistRecord?.collegeName || participantRecord?.collegeName || '—';
    const participantId = whitelistRecord?.participantId || participantRecord?.participantId || '—';

    // 4. Reject if participant is revoked
    if (status === 'REVOKED') {
      return NextResponse.json(
        {
          status: 'REVOKED',
          error: 'Participant registration has been revoked by organizers.',
          participant: {
            fullName,
            email,
            teamName,
            collegeName,
            participantId,
            foodPassId: normalizedPassId,
            foodReceived: whitelistRecord?.foodReceived || participantRecord?.foodReceived || false,
          },
        },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }

    // 5. Check if Food Pass has ALREADY been claimed/received
    const isAlreadyReceived = whitelistRecord?.foodReceived || participantRecord?.foodReceived;
    if (isAlreadyReceived) {
      return NextResponse.json(
        {
          status: 'ALREADY_RECEIVED',
          message: 'Food Already Received',
          error: 'Meal has already been claimed for this Food Pass.',
          participant: {
            fullName,
            email,
            teamName,
            collegeName,
            participantId,
            foodPassId: normalizedPassId,
            foodReceived: true,
          },
        },
        { headers: NO_CACHE_HEADERS }
      );
    }

    // 6. Mark foodReceived = TRUE and record timestamp synchronously in BOTH tables
    const now = new Date();
    if (whitelistRecord) {
      await prisma.whitelistParticipant.update({
        where: { id: whitelistRecord.id },
        data: { foodReceived: true, foodReceivedAt: now },
      });
    }

    if (participantRecord) {
      await prisma.participant.update({
        where: { id: participantRecord.id },
        data: { foodReceived: true, foodReceivedAt: now },
      });
    }

    if (participantId && participantId !== '—') {
      await prisma.whitelistParticipant.updateMany({
        where: { participantId },
        data: { foodReceived: true, foodReceivedAt: now },
      });
      await prisma.participant.updateMany({
        where: { participantId },
        data: { foodReceived: true, foodReceivedAt: now },
      });
    }

    return NextResponse.json(
      {
        status: 'SUCCESS',
        message: 'Food Pass Verified',
        participant: {
          fullName,
          email,
          teamName,
          collegeName,
          participantId,
          foodPassId: normalizedPassId,
          foodReceived: true,
        },
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    console.error('Food verification error:', error);
    return NextResponse.json(
      { status: 'ERROR', error: error?.message || 'Failed to verify Food Pass.' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
