import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import {
  syncPersistentWhitelist,
  savePersistedParticipant,
} from '@/lib/persistentStore';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { foodPassId } = body;

    if (!foodPassId || !foodPassId.trim()) {
      return NextResponse.json(
        { status: 'INVALID', error: 'Food Pass ID is required.' },
        { status: 400 }
      );
    }

    const normalizedPassId = foodPassId.trim().toUpperCase();

    // Auto-sync persistent store to database before lookup
    await syncPersistentWhitelist(prisma);

    // 1. Search database for participant with this Food Pass ID
    let whitelistRecord = await prisma.whitelistParticipant.findFirst({
      where: {
        foodPassId: {
          equals: normalizedPassId,
        },
      },
    });

    // Fallback case-insensitive check if SQLite provider requires it
    if (!whitelistRecord) {
      const allWithFoodPass = await prisma.whitelistParticipant.findMany({
        where: { foodPassGenerated: true },
      });
      whitelistRecord =
        allWithFoodPass.find(
          (item) => item.foodPassId?.trim().toUpperCase() === normalizedPassId
        ) || null;
    }

    // 2. Reject if Food Pass ID does not exist
    if (!whitelistRecord) {
      return NextResponse.json(
        { status: 'INVALID', error: 'Invalid Food Pass ID. Pass record not found.' },
        { status: 404 }
      );
    }

    // 3. Reject if participant is revoked
    if (whitelistRecord.status === 'REVOKED') {
      return NextResponse.json(
        {
          status: 'REVOKED',
          error: 'Participant registration has been revoked by organizers.',
          participant: {
            fullName: whitelistRecord.fullName,
            email: whitelistRecord.email,
            teamName: whitelistRecord.teamName,
            collegeName: whitelistRecord.collegeName,
            participantId: whitelistRecord.participantId || '—',
            foodPassId: whitelistRecord.foodPassId,
            foodReceived: whitelistRecord.foodReceived,
          },
        },
        { status: 403 }
      );
    }

    // 4. Check if Food Pass has ALREADY been claimed/received
    if (whitelistRecord.foodReceived) {
      return NextResponse.json({
        status: 'ALREADY_RECEIVED',
        message: 'Food Already Received',
        error: 'Meal has already been claimed for this Food Pass.',
        participant: {
          fullName: whitelistRecord.fullName,
          email: whitelistRecord.email,
          teamName: whitelistRecord.teamName,
          collegeName: whitelistRecord.collegeName,
          participantId: whitelistRecord.participantId || '—',
          foodPassId: whitelistRecord.foodPassId,
          foodReceived: true,
        },
      });
    }

    // 5. Mark foodReceived = TRUE and record timestamp in Whitelist database
    const now = new Date();
    const updatedRecord = await prisma.whitelistParticipant.update({
      where: { id: whitelistRecord.id },
      data: { foodReceived: true, foodReceivedAt: now },
    });

    savePersistedParticipant(updatedRecord);

    // 6. Also mark foodReceived = TRUE in Participant table if claimed
    if (whitelistRecord.participantId) {
      await prisma.participant.updateMany({
        where: { participantId: whitelistRecord.participantId },
        data: { foodReceived: true, foodReceivedAt: now },
      });
    }

    return NextResponse.json({
      status: 'SUCCESS',
      message: 'Food Pass Verified',
      participant: {
        fullName: whitelistRecord.fullName,
        email: whitelistRecord.email,
        teamName: whitelistRecord.teamName,
        collegeName: whitelistRecord.collegeName,
        participantId: whitelistRecord.participantId || '—',
        foodPassId: whitelistRecord.foodPassId,
        foodReceived: true,
      },
    });
  } catch (error: any) {
    console.error('Food verification error:', error);
    return NextResponse.json(
      { status: 'ERROR', error: error?.message || 'Failed to verify Food Pass.' },
      { status: 500 }
    );
  }
}
