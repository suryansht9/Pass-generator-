import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { formatParticipantId, generateVerificationToken } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, fullName, collegeName, teamName, photoUrl, accessCode } = body;

    // Validation
    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }
    if (!fullName || !fullName.trim()) {
      return NextResponse.json({ error: 'Full name is required.' }, { status: 400 });
    }
    if (!collegeName || !collegeName.trim()) {
      return NextResponse.json({ error: 'College name is required.' }, { status: 400 });
    }
    if (!teamName || !teamName.trim()) {
      return NextResponse.json({ error: 'Team name is required.' }, { status: 400 });
    }
    if (!photoUrl) {
      return NextResponse.json({ error: 'Profile photo is required.' }, { status: 400 });
    }

    const emailToMatch = email.trim().toLowerCase();
    const codeToMatch = accessCode ? accessCode.trim().toUpperCase() : null;

    // 1. PRIMARY EMAIL WHITELIST LOOKUP
    let whitelistRecord = await prisma.whitelistParticipant.findFirst({
      where: { email: emailToMatch },
    });

    // Fallback lookup by access code if provided and email wasn't found directly
    if (!whitelistRecord && codeToMatch) {
      whitelistRecord = await prisma.whitelistParticipant.findFirst({
        where: { accessCode: codeToMatch },
      });
    }

    // DENY REGISTRATION IF EMAIL IS NOT PRE-REGISTERED IN WHITELIST
    if (!whitelistRecord) {
      return NextResponse.json(
        {
          error: 'Your email address is not registered for this hackathon. Please contact the organizers.',
          isUnregistered: true,
        },
        { status: 403 }
      );
    }

    // CHECK IF PASS IS ALREADY CLAIMED OR REVOKED
    if (whitelistRecord.status === 'CLAIMED') {
      return NextResponse.json(
        {
          error: 'Pass has already been generated for this email address.',
          isAlreadyClaimed: true,
          participantId: whitelistRecord.participantId,
        },
        { status: 400 }
      );
    }

    if (whitelistRecord.status === 'REVOKED') {
      return NextResponse.json(
        {
          error: 'Your registration has been revoked by the organizers.',
          isRevoked: true,
        },
        { status: 403 }
      );
    }

    // 2. GENERATE UNIQUE PARTICIPANT ID (e.g. CFC-2026-0001)
    const count = await prisma.participant.count();
    let nextNum = count + 1;
    let participantId = formatParticipantId(nextNum);

    while (await prisma.participant.findUnique({ where: { participantId } })) {
      nextNum++;
      participantId = formatParticipantId(nextNum);
    }

    const verificationToken = generateVerificationToken();

    // 3. CREATE OFFICIAL PARTICIPANT PASS RECORD
    const participant = await prisma.participant.create({
      data: {
        participantId,
        fullName: fullName.trim() || whitelistRecord.fullName,
        collegeName: collegeName.trim() || whitelistRecord.collegeName,
        teamName: teamName.trim() || whitelistRecord.teamName,
        photoUrl,
        verificationToken,
        status: 'ACTIVE',
      },
    });

    // 4. MARK WHITELIST ENTRY AS CLAIMED
    await prisma.whitelistParticipant.update({
      where: { id: whitelistRecord.id },
      data: {
        status: 'CLAIMED',
        claimedAt: new Date(),
        participantId: participant.participantId,
        // Update stored details if provided
        fullName: fullName.trim(),
        collegeName: collegeName.trim(),
        teamName: teamName.trim(),
      },
    });

    // Mark access code as USED if applicable
    if (codeToMatch) {
      await prisma.accessCode.updateMany({
        where: { code: codeToMatch },
        data: {
          status: 'USED',
          usedBy: participantId,
          usedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      participantId: participant.participantId,
      fullName: participant.fullName,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed due to a server error. Please try again.' },
      { status: 500 }
    );
  }
}
