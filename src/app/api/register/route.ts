import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { formatParticipantId, generateVerificationToken } from '@/lib/utils';

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
    const { email, fullName, collegeName, teamName, photoUrl, accessCode } = body;

    // Validation
    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400, headers: NO_CACHE_HEADERS });
    }
    if (!fullName || !fullName.trim()) {
      return NextResponse.json({ error: 'Full name is required.' }, { status: 400, headers: NO_CACHE_HEADERS });
    }
    if (!collegeName || !collegeName.trim()) {
      return NextResponse.json({ error: 'College name is required.' }, { status: 400, headers: NO_CACHE_HEADERS });
    }
    if (!teamName || !teamName.trim()) {
      return NextResponse.json({ error: 'Team name is required.' }, { status: 400, headers: NO_CACHE_HEADERS });
    }
    if (!photoUrl) {
      return NextResponse.json({ error: 'Profile photo is required.' }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    const emailToMatch = email.trim().toLowerCase();
    const codeToMatch = accessCode ? accessCode.trim().toUpperCase() : null;

    // Check if participant pass already exists in Participant table by email
    const existingParticipant = await prisma.participant.findFirst({
      where: { email: emailToMatch },
    });

    if (existingParticipant) {
      return NextResponse.json(
        {
          error: 'Pass has already been generated for this email address.',
          isAlreadyClaimed: true,
          participantId: existingParticipant.participantId,
        },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    // 1. STRICT EMAIL WHITELIST LOOKUP
    let whitelistRecord = await prisma.whitelistParticipant.findFirst({
      where: { email: emailToMatch },
    });

    // Fallback lookup by access code if provided in WhitelistParticipant
    if (!whitelistRecord && codeToMatch) {
      whitelistRecord = await prisma.whitelistParticipant.findFirst({
        where: { accessCode: codeToMatch },
      });
    }

    // Check AccessCode table directly if not found in WhitelistParticipant
    let validAccessCodeRecord = null;
    if (!whitelistRecord && codeToMatch) {
      validAccessCodeRecord = await prisma.accessCode.findFirst({
        where: { code: codeToMatch, status: 'ACTIVE' },
      });
    }

    // REJECT REGISTRATION IF EMAIL/ACCESS CODE IS NOT REGISTERED OR VALID
    if (!whitelistRecord && !validAccessCodeRecord) {
      return NextResponse.json(
        {
          error: 'Your email address or access code is not registered for this hackathon. Please contact the organizers.',
          isUnregistered: true,
        },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }

    // CHECK IF PASS IS ALREADY CLAIMED OR REVOKED
    if (whitelistRecord && whitelistRecord.status === 'CLAIMED') {
      return NextResponse.json(
        {
          error: 'Pass has already been generated for this email address.',
          isAlreadyClaimed: true,
          participantId: whitelistRecord.participantId,
        },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    if (whitelistRecord && whitelistRecord.status === 'REVOKED') {
      return NextResponse.json(
        {
          error: 'Your registration has been revoked by the organizers.',
          isRevoked: true,
        },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }

    // If registered via valid AccessCode without existing WhitelistParticipant, create Whitelist entry
    if (!whitelistRecord && validAccessCodeRecord) {
      whitelistRecord = await prisma.whitelistParticipant.create({
        data: {
          email: emailToMatch,
          fullName: fullName.trim(),
          collegeName: collegeName.trim(),
          teamName: teamName.trim(),
          accessCode: codeToMatch,
          status: 'PENDING',
        },
      });
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

    // 3. CREATE OFFICIAL PARTICIPANT PASS RECORD IN DATABASE
    const participant = await prisma.participant.create({
      data: {
        participantId,
        fullName: fullName.trim(),
        collegeName: collegeName.trim(),
        teamName: teamName.trim(),
        email: emailToMatch,
        photoUrl,
        verificationToken,
        status: 'ACTIVE',
      },
    });

    // 4. MARK WHITELIST ENTRY AS CLAIMED IN DATABASE
    if (whitelistRecord) {
      await prisma.whitelistParticipant.update({
        where: { id: whitelistRecord.id },
        data: {
          status: 'CLAIMED',
          claimedAt: new Date(),
          participantId: participant.participantId,
          fullName: fullName.trim(),
          collegeName: collegeName.trim(),
          teamName: teamName.trim(),
          email: emailToMatch,
        },
      });
    }

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

    return NextResponse.json(
      {
        success: true,
        participantId: participant.participantId,
        fullName: participant.fullName,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error?.message || 'Registration failed due to a server error. Please try again.' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
