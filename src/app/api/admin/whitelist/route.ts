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

    // Check if bulk import (Array) or single creation (Object)
    if (Array.isArray(body.participants)) {
      const items = body.participants;
      let createdCount = 0;
      let skippedCount = 0;

      for (const item of items) {
        if (!item.fullName || !item.fullName.trim()) continue;

        const name = item.fullName.trim();
        const college = (item.collegeName || 'Unknown College').trim();
        const team = (item.teamName || 'Independent Team').trim();
        const email = item.email ? item.email.trim().toLowerCase() : null;
        const accessCode = item.accessCode ? item.accessCode.trim().toUpperCase() : null;

        // Check duplicate by name or email or access code
        const existing = await prisma.whitelistParticipant.findFirst({
          where: {
            OR: [
              { fullName: name },
              ...(email ? [{ email }] : []),
              ...(accessCode ? [{ accessCode }] : []),
            ],
          },
        });

        if (existing) {
          skippedCount++;
          continue;
        }

        await prisma.whitelistParticipant.create({
          data: {
            fullName: name,
            collegeName: college,
            teamName: team,
            email: email || undefined,
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
    const { fullName, collegeName, teamName, email, accessCode } = body;

    if (!fullName || !fullName.trim()) {
      return NextResponse.json({ error: 'Full name is required.' }, { status: 400 });
    }

    const name = fullName.trim();
    const college = (collegeName || 'Unknown College').trim();
    const team = (teamName || 'Independent Team').trim();
    const mail = email ? email.trim().toLowerCase() : null;
    const code = accessCode ? accessCode.trim().toUpperCase() : null;

    const existing = await prisma.whitelistParticipant.findFirst({
      where: {
        OR: [
          { fullName: name },
          ...(mail ? [{ email: mail }] : []),
          ...(code ? [{ accessCode: code }] : []),
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Participant is already in the pre-registered whitelist.' },
        { status: 400 }
      );
    }

    const created = await prisma.whitelistParticipant.create({
      data: {
        fullName: name,
        collegeName: college,
        teamName: team,
        email: mail || undefined,
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
