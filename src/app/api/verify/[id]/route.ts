import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rawId = params.id;

    if (!rawId || !rawId.trim()) {
      return NextResponse.json(
        { status: 'INVALID', error: 'Missing Participant ID' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const id = rawId.trim();
    const normalizedIdUpper = id.toUpperCase();
    const normalizedIdLower = id.toLowerCase();

    // 1. Search Participant table
    let participant = await prisma.participant.findFirst({
      where: {
        OR: [
          { participantId: id },
          { participantId: normalizedIdUpper },
          { verificationToken: id },
          { verificationToken: normalizedIdLower },
        ],
      },
    });

    // 2. Fallback search WhitelistParticipant table if not in Participant table
    let whitelistRecord = null;
    if (!participant) {
      whitelistRecord = await prisma.whitelistParticipant.findFirst({
        where: {
          OR: [
            { participantId: id },
            { participantId: normalizedIdUpper },
            { email: normalizedIdLower },
            { accessCode: normalizedIdUpper },
          ],
        },
      });

      if (whitelistRecord) {
        // Construct participant view object from Whitelist record
        participant = {
          id: whitelistRecord.id,
          participantId: whitelistRecord.participantId || id,
          fullName: whitelistRecord.fullName,
          collegeName: whitelistRecord.collegeName,
          teamName: whitelistRecord.teamName,
          email: whitelistRecord.email || null,
          photoUrl: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(whitelistRecord.fullName) + '&background=111318&color=fff&size=200',
          verificationToken: id,
          status: whitelistRecord.status === 'REVOKED' ? 'REVOKED' : 'ACTIVE',
          checkedIn: whitelistRecord.checkedIn,
          checkedInAt: whitelistRecord.checkedInAt,
          foodPassGenerated: whitelistRecord.foodPassGenerated,
          foodPassGeneratedAt: whitelistRecord.foodPassGeneratedAt,
          foodPassId: whitelistRecord.foodPassId,
          foodReceived: whitelistRecord.foodReceived,
          foodReceivedAt: whitelistRecord.foodReceivedAt,
          createdAt: whitelistRecord.createdAt,
          updatedAt: whitelistRecord.createdAt,
        };
      }
    }

    if (!participant) {
      return NextResponse.json(
        {
          status: 'INVALID',
          message: 'Invalid Participant ID or Token',
        },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    if (participant.status === 'REVOKED') {
      return NextResponse.json(
        {
          status: 'REVOKED',
          message: 'Pass has been revoked',
          participant: {
            participantId: participant.participantId,
            fullName: participant.fullName,
            collegeName: participant.collegeName,
            teamName: participant.teamName,
            photoUrl: participant.photoUrl,
            status: 'REVOKED',
            checkedIn: participant.checkedIn,
          },
        },
        { headers: NO_CACHE_HEADERS }
      );
    }

    // Auto-mark checkedIn = true and record checkedInAt timestamp in Database
    const now = new Date();
    if (!participant.checkedIn) {
      await prisma.participant.updateMany({
        where: {
          OR: [
            { participantId: participant.participantId },
            { id: participant.id },
          ],
        },
        data: { checkedIn: true, checkedInAt: now },
      });

      await prisma.whitelistParticipant.updateMany({
        where: {
          OR: [
            { participantId: participant.participantId },
            { id: participant.id },
          ],
        },
        data: { checkedIn: true, checkedInAt: now },
      });
    }

    return NextResponse.json(
      {
        status: 'VALID',
        message: 'Official Participant Pass',
        participant: {
          participantId: participant.participantId,
          fullName: participant.fullName,
          collegeName: participant.collegeName,
          teamName: participant.teamName,
          photoUrl: participant.photoUrl,
          status: 'ACTIVE',
          checkedIn: true,
          createdAt: participant.createdAt,
        },
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error) {
    console.error('Verification API Error:', error);
    return NextResponse.json(
      { status: 'ERROR', error: 'Verification service error' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

