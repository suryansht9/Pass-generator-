import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { status: 'INVALID', error: 'Missing Participant ID' },
        { status: 400 }
      );
    }

    const participant = await prisma.participant.findFirst({
      where: {
        OR: [{ participantId: id }, { verificationToken: id }],
      },
    });

    if (!participant) {
      return NextResponse.json(
        {
          status: 'INVALID',
          message: 'Invalid Participant ID or Token',
        },
        { status: 404 }
      );
    }

    if (participant.status === 'REVOKED') {
      return NextResponse.json({
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
      });
    }

    // Auto-mark checkedIn = true and record checkedInAt timestamp when valid main pass QR is verified
    const now = new Date();
    if (!participant.checkedIn) {
      await prisma.participant.update({
        where: { id: participant.id },
        data: { checkedIn: true, checkedInAt: now },
      });

      await prisma.whitelistParticipant.updateMany({
        where: { participantId: participant.participantId },
        data: { checkedIn: true, checkedInAt: now },
      });
    }

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('Verification API Error:', error);
    return NextResponse.json(
      { status: 'ERROR', error: 'Verification service error' },
      { status: 500 }
    );
  }
}
