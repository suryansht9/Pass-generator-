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
    const { email, fullName } = body;

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    const emailToMatch = email.trim().toLowerCase();

    // Auto-sync persistent store to database before lookup
    await syncPersistentWhitelist(prisma);

    // Look up participant in Whitelist database strictly by normalized email
    let whitelistRecord = await prisma.whitelistParticipant.findFirst({
      where: { email: emailToMatch },
    });

    if (!whitelistRecord) {
      return NextResponse.json(
        { error: 'Your email is not registered for this event.', isUnregistered: true },
        { status: 403 }
      );
    }

    // Check if Food Pass is already generated for this participant
    if (whitelistRecord.foodPassGenerated && whitelistRecord.foodPassId) {
      return NextResponse.json({
        success: true,
        isAlreadyGenerated: true,
        foodPass: {
          foodPassId: whitelistRecord.foodPassId,
          fullName: fullName && fullName.trim() ? fullName.trim() : whitelistRecord.fullName,
          email: whitelistRecord.email || emailToMatch,
          teamName: whitelistRecord.teamName,
          collegeName: whitelistRecord.collegeName,
          participantId: whitelistRecord.participantId || undefined,
          foodReceived: whitelistRecord.foodReceived,
        },
      });
    }

    // Generate unique Food Pass ID e.g. FOOD-2026-0001
    const count = await prisma.whitelistParticipant.count({
      where: { foodPassGenerated: true },
    });
    const nextNum = count + 1;
    const foodPassId = `FOOD-2026-${String(nextNum).padStart(4, '0')}`;

    const now = new Date();
    // Mark foodPassGenerated = true and store foodPassId and timestamp
    const updatedRecord = await prisma.whitelistParticipant.update({
      where: { id: whitelistRecord.id },
      data: {
        foodPassGenerated: true,
        foodPassGeneratedAt: now,
        foodPassId,
        fullName: fullName && fullName.trim() ? fullName.trim() : whitelistRecord.fullName,
      },
    });

    savePersistedParticipant(updatedRecord);

    // Also update Participant table if claimed
    if (whitelistRecord.participantId) {
      await prisma.participant.updateMany({
        where: { participantId: whitelistRecord.participantId },
        data: {
          foodPassGenerated: true,
          foodPassGeneratedAt: now,
          foodPassId,
        },
      });
    }

    return NextResponse.json({
      success: true,
      foodPass: {
        foodPassId,
        fullName: fullName && fullName.trim() ? fullName.trim() : whitelistRecord.fullName,
        email: whitelistRecord.email || emailToMatch,
        teamName: whitelistRecord.teamName,
        collegeName: whitelistRecord.collegeName,
        participantId: whitelistRecord.participantId || undefined,
        foodReceived: whitelistRecord.foodReceived,
      },
    });
  } catch (error: any) {
    console.error('Food check-in error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process Food Pass check-in.' },
      { status: 500 }
    );
  }
}
