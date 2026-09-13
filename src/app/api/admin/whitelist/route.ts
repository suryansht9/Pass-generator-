import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function GET(req: NextRequest) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: NO_CACHE_HEADERS }
      );
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim() || '';

    const whereCondition = query
      ? {
          OR: [
            { email: { contains: query } },
            { fullName: { contains: query } },
            { collegeName: { contains: query } },
            { teamName: { contains: query } },
            { accessCode: { contains: query } },
            { participantId: { contains: query } },
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

    return NextResponse.json(
      {
        success: true,
        stats: {
          totalCapacity,
          totalPreRegistered,
          claimedPasses,
          pendingPasses,
          remainingSlots: totalCapacity - totalPreRegistered,
        },
        whitelist,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    console.error('Fetch whitelist error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch whitelist' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: NO_CACHE_HEADERS }
      );
    }

    const body = await req.json();

    // Bulk Import (Array)
    if (Array.isArray(body.participants)) {
      const items = body.participants;
      let createdCount = 0;
      let skippedCount = 0;

      const seenEmails = new Set<string>();

      for (const item of items) {
        if (!item.email || !item.email.trim()) continue;

        const mail = item.email.trim().toLowerCase();
        if (seenEmails.has(mail)) {
          skippedCount++;
          continue;
        }
        seenEmails.add(mail);

        const name = (item.fullName || 'Selected Participant').trim();
        const college = (item.collegeName || 'CMP College').trim();
        const team = (item.teamName || 'Team Hack').trim();
        const accessCode = item.accessCode && item.accessCode.trim() ? item.accessCode.trim().toUpperCase() : null;

        // Check duplicate by primary email identifier across both Whitelist and Participant tables
        const existingWhitelist = await prisma.whitelistParticipant.findFirst({
          where: { email: mail },
        });
        const existingParticipant = await prisma.participant.findFirst({
          where: { email: mail },
        });

        if (existingWhitelist || existingParticipant) {
          skippedCount++;
          continue;
        }

        await prisma.whitelistParticipant.create({
          data: {
            email: mail,
            fullName: name,
            collegeName: college,
            teamName: team,
            accessCode: accessCode || undefined,
            status: 'PENDING',
          },
        });

        createdCount++;
      }

      return NextResponse.json(
        {
          success: true,
          message: `Successfully imported ${createdCount} selected participants. (${skippedCount} duplicates skipped)`,
          createdCount,
          skippedCount,
        },
        { headers: NO_CACHE_HEADERS }
      );
    }

    // Single Whitelist Pre-Registration
    const { email, fullName, collegeName, teamName, accessCode } = body;

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Email address is required for pre-registration.' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const mail = email.trim().toLowerCase();
    const name = (fullName || 'Selected Participant').trim();
    const college = (collegeName || 'CMP College').trim();
    const team = (teamName || 'Team Hack').trim();
    const code = accessCode && accessCode.trim() ? accessCode.trim().toUpperCase() : null;

    // Primary Email Uniqueness Check across both Whitelist and Participant tables
    const existingWhitelist = await prisma.whitelistParticipant.findFirst({
      where: { email: mail },
    });
    const existingParticipant = await prisma.participant.findFirst({
      where: { email: mail },
    });

    if (existingWhitelist || existingParticipant) {
      return NextResponse.json(
        { error: 'Participant with this email is already whitelisted or registered.' },
        { status: 400, headers: NO_CACHE_HEADERS }
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

    return NextResponse.json(
      { success: true, participant: created },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    console.error('Whitelist create error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process whitelist entry' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

