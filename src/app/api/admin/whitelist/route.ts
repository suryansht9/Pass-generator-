import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    const whereCondition = query
      ? {
          OR: [
            { fullName: { contains: query } },
            { collegeName: { contains: query } },
            { teamName: { contains: query } },
            { email: { contains: query } },
            { accessCode: { contains: query } },
          ],
        }
      : {};

    const whitelist = await prisma.whitelistParticipant.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
    });

    const totalCapacity = 200;
    const totalPreRegistered = await prisma.whitelistParticipant.count();
    const claimedPasses = await prisma.whitelistParticipant.count({ where: { status: 'CLAIMED' } });
    const pendingPasses = await prisma.whitelistParticipant.count({ where: { status: 'PENDING' } });

    return NextResponse.json({
      success: true,
      stats: {
        totalCapacity,
        totalPreRegistered,
        claimedPasses,
        pendingPasses,
        remainingSlots: totalCapacity - totalPreRegistered,
      },
      whitelist,
    });
  } catch (error) {
    console.error('Fetch whitelist error:', error);
    return NextResponse.json({ error: 'Failed to fetch whitelist' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Bulk Import (Array)
    if (Array.isArray(body.participants)) {
      const items = body.participants;
      let createdCount = 0;
      let skippedCount = 0;

      for (const item of items) {
        const mail = item.email ? item.email.trim().toLowerCase() : null;
        const name = (item.fullName || 'Selected Participant').trim();
        const college = (item.collegeName || 'CMP College').trim();
        const team = (item.teamName || 'Team Hack').trim();
        const accessCode = item.accessCode ? item.accessCode.trim().toUpperCase() : null;

        if (!mail && !name) continue;

        // Check duplicate by email or accessCode
        const existing = await prisma.whitelistParticipant.findFirst({
          where: {
            OR: [
              ...(mail ? [{ email: mail }] : []),
              ...(accessCode ? [{ accessCode }] : []),
              ...(!mail && !accessCode ? [{ fullName: name }] : []),
            ],
          },
        });

        if (existing) {
          skippedCount++;
          continue;
        }

        await prisma.whitelistParticipant.create({
          data: {
            email: mail || undefined,
            fullName: name,
            collegeName: college,
            teamName: team,
            accessCode: accessCode || undefined,
            status: 'PENDING',
          },
        });
        createdCount++;
      }

      return NextResponse.json({
        success: true,
        message: `Successfully imported ${createdCount} selected participants. (${skippedCount} duplicates skipped)`,
        createdCount,
        skippedCount,
      });
    }

    // Single Creation
    const { email, fullName, collegeName, teamName, accessCode } = body;

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email address is required for pre-registration.' }, { status: 400 });
    }

    const mail = email.trim().toLowerCase();
    const name = (fullName || 'Selected Participant').trim();
    const college = (collegeName || 'CMP College').trim();
    const team = (teamName || 'Team Hack').trim();
    const code = accessCode ? accessCode.trim().toUpperCase() : null;

    const existing = await prisma.whitelistParticipant.findFirst({
      where: {
        OR: [
          { email: mail },
          ...(code ? [{ accessCode: code }] : []),
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'This email address is already in the pre-registered whitelist.' },
        { status: 400 }
      );
    }

    const created = await prisma.whitelistParticipant.create({
      data: {
        email: mail,
        fullName: name,
        collegeName: college,
        teamName: team,
        accessCode: code || undefined,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ success: true, participant: created });
  } catch (error) {
    console.error('Whitelist create/import error:', error);
    return NextResponse.json({ error: 'Failed to process whitelist entry' }, { status: 500 });
  }
}
