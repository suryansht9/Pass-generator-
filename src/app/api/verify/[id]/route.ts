import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

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
        },
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
