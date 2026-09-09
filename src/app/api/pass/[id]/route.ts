import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: 'Participant ID required' }, { status: 400 });
    }

    const participant = await prisma.participant.findUnique({
      where: { participantId: id },
    });

    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, participant });
  } catch (error) {
    console.error('Fetch pass error:', error);
    return NextResponse.json({ error: 'Failed to fetch pass details' }, { status: 500 });
  }
}
