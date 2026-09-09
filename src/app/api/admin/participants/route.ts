import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    const whereCondition = query
      ? {
          OR: [
            { fullName: { contains: query } },
            { collegeName: { contains: query } },
            { teamName: { contains: query } },
            { participantId: { contains: query } },
          ],
        }
      : {};

    const participants = await prisma.participant.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
    });

    // Analytics counters
    const totalParticipants = await prisma.participant.count();
    const activePasses = await prisma.participant.count({ where: { status: 'ACTIVE' } });
    const revokedPasses = await prisma.participant.count({ where: { status: 'REVOKED' } });

    // Distinct teams & colleges counts
    const teamsGroup = await prisma.participant.groupBy({
      by: ['teamName'],
    });
    const collegesGroup = await prisma.participant.groupBy({
      by: ['collegeName'],
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalParticipants,
        activePasses,
        revokedPasses,
        totalTeams: teamsGroup.length,
        totalColleges: collegesGroup.length,
      },
      participants,
    });
  } catch (error) {
    console.error('Admin participants list error:', error);
    return NextResponse.json({ error: 'Failed to load participants' }, { status: 500 });
  }
}
