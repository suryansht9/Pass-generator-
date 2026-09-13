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
        { error: 'Participant ID required' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const id = rawId.trim();
    const normalizedUpper = id.toUpperCase();
    const normalizedLower = id.toLowerCase();

    let participant = await prisma.participant.findFirst({
      where: {
        OR: [
          { participantId: id },
          { participantId: normalizedUpper },
          { verificationToken: id },
          { verificationToken: normalizedLower },
          { email: normalizedLower },
        ],
      },
    });

    if (!participant) {
      const whitelistRecord = await prisma.whitelistParticipant.findFirst({
        where: {
          OR: [
            { participantId: id },
            { participantId: normalizedUpper },
            { email: normalizedLower },
            { accessCode: normalizedUpper },
          ],
        },
      });

      if (whitelistRecord) {
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
        { error: 'Participant not found' },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    return NextResponse.json(
      { success: true, participant },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    console.error('Fetch pass error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch pass details' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
