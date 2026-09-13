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
    const { email, fullName } = body;

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Email address is required.' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const emailToMatch = email.trim().toLowerCase();

    // 1. Look up in WhitelistParticipant table
    let whitelistRecord = await prisma.whitelistParticipant.findFirst({
      where: { email: emailToMatch },
    });

    // 2. Look up in Participant table if not found in WhitelistParticipant
    let participantRecord = await prisma.participant.findFirst({
      where: { email: emailToMatch },
    });

    if (!whitelistRecord && !participantRecord) {
      return NextResponse.json(
        { error: 'Your email is not registered for this event.', isUnregistered: true },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }

    // Auto-create Whitelist record if participant exists in Participant table
    if (!whitelistRecord && participantRecord) {
      whitelistRecord = await prisma.whitelistParticipant.create({
        data: {
          email: emailToMatch,
          fullName: participantRecord.fullName,
          collegeName: participantRecord.collegeName,
          teamName: participantRecord.teamName,
          participantId: participantRecord.participantId,
          status: 'CLAIMED',
          claimedAt: participantRecord.createdAt,
        },
      });
    }

    // Check if Food Pass is already generated
    const existingFoodPassId = whitelistRecord?.foodPassId || participantRecord?.foodPassId;
    const foodPassAlreadyGen = whitelistRecord?.foodPassGenerated || participantRecord?.foodPassGenerated;

    if (foodPassAlreadyGen && existingFoodPassId) {
      return NextResponse.json(
        {
          success: true,
          isAlreadyGenerated: true,
          foodPass: {
            foodPassId: existingFoodPassId,
            fullName: fullName && fullName.trim() ? fullName.trim() : (whitelistRecord?.fullName || participantRecord?.fullName),
            email: whitelistRecord?.email || emailToMatch,
            teamName: whitelistRecord?.teamName || participantRecord?.teamName,
            collegeName: whitelistRecord?.collegeName || participantRecord?.collegeName,
            participantId: whitelistRecord?.participantId || participantRecord?.participantId || undefined,
            foodReceived: whitelistRecord?.foodReceived || participantRecord?.foodReceived || false,
          },
        },
        { headers: NO_CACHE_HEADERS }
      );
    }

    // Generate unique Food Pass ID e.g. FOOD-2026-0001
    const countWhitelist = await prisma.whitelistParticipant.count({
      where: { foodPassGenerated: true },
    });
    const countParticipant = await prisma.participant.count({
      where: { foodPassGenerated: true },
    });
    const maxCount = Math.max(countWhitelist, countParticipant);
    let nextNum = maxCount + 1;
    let foodPassId = `FOOD-2026-${String(nextNum).padStart(4, '0')}`;

    while (
      (await prisma.whitelistParticipant.findFirst({ where: { foodPassId } })) ||
      (await prisma.participant.findFirst({ where: { foodPassId } }))
    ) {
      nextNum++;
      foodPassId = `FOOD-2026-${String(nextNum).padStart(4, '0')}`;
    }

    const now = new Date();
    const updateData = {
      foodPassGenerated: true,
      foodPassGeneratedAt: now,
      foodPassId,
      ...(fullName && fullName.trim() ? { fullName: fullName.trim() } : {}),
    };

    // Update WhitelistParticipant table
    if (whitelistRecord) {
      await prisma.whitelistParticipant.update({
        where: { id: whitelistRecord.id },
        data: updateData,
      });
    }

    // Update Participant table
    const targetParticipantId = whitelistRecord?.participantId || participantRecord?.participantId;
    if (targetParticipantId) {
      await prisma.participant.updateMany({
        where: { participantId: targetParticipantId },
        data: updateData,
      });
    } else if (participantRecord) {
      await prisma.participant.update({
        where: { id: participantRecord.id },
        data: updateData,
      });
    }

    const displayName = fullName && fullName.trim() ? fullName.trim() : (whitelistRecord?.fullName || participantRecord?.fullName || 'Participant');
    const displayTeam = whitelistRecord?.teamName || participantRecord?.teamName || 'Independent Team';
    const displayCollege = whitelistRecord?.collegeName || participantRecord?.collegeName || 'CMP College';

    return NextResponse.json(
      {
        success: true,
        foodPass: {
          foodPassId,
          fullName: displayName,
          email: emailToMatch,
          teamName: displayTeam,
          collegeName: displayCollege,
          participantId: targetParticipantId || undefined,
          foodReceived: whitelistRecord?.foodReceived || participantRecord?.foodReceived || false,
        },
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    console.error('Food check-in error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process Food Pass check-in.' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
