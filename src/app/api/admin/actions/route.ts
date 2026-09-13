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
        { error: 'Unauthorized admin access.' },
        { status: 401, headers: NO_CACHE_HEADERS }
      );
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim().toLowerCase() || '';

    // Fetch latest participant action data directly from backend database
    let whitelist = await prisma.whitelistParticipant.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Apply search filtering if query exists
    if (query) {
      whitelist = whitelist.filter((item) => {
        const idMatch = item.participantId?.toLowerCase().includes(query);
        const nameMatch = item.fullName.toLowerCase().includes(query);
        const emailMatch = item.email?.toLowerCase().includes(query);
        const teamMatch = item.teamName.toLowerCase().includes(query);
        const collegeMatch = item.collegeName.toLowerCase().includes(query);
        const foodPassMatch = item.foodPassId?.toLowerCase().includes(query);
        return idMatch || nameMatch || emailMatch || teamMatch || collegeMatch || foodPassMatch;
      });
    }

    // Calculate exact real-time stats from database records
    const totalRegistered = whitelist.length;
    const mainPassGenerated = whitelist.filter((item) => item.status === 'CLAIMED' || Boolean(item.participantId)).length;
    const entryCheckedIn = whitelist.filter((item) => item.checkedIn).length;
    const foodPassGenerated = whitelist.filter((item) => item.foodPassGenerated).length;
    const foodReceived = whitelist.filter((item) => item.foodReceived).length;

    const formattedParticipants = whitelist.map((item) => ({
      id: item.id,
      participantId: item.participantId || '—',
      fullName: item.fullName,
      email: item.email || '—',
      collegeName: item.collegeName,
      teamName: item.teamName,
      status: item.status,
      claimedAt: item.claimedAt ? new Date(item.claimedAt).toISOString() : null,
      checkedIn: item.checkedIn,
      checkedInAt: item.checkedInAt ? new Date(item.checkedInAt).toISOString() : null,
      foodPassGenerated: item.foodPassGenerated,
      foodPassGeneratedAt: item.foodPassGeneratedAt ? new Date(item.foodPassGeneratedAt).toISOString() : null,
      foodPassId: item.foodPassId || '—',
      foodReceived: item.foodReceived,
      foodReceivedAt: item.foodReceivedAt ? new Date(item.foodReceivedAt).toISOString() : null,
      createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : null,
    }));

    return NextResponse.json(
      {
        success: true,
        stats: {
          totalRegistered,
          mainPassGenerated,
          entryCheckedIn,
          foodPassGenerated,
          foodReceived,
        },
        participants: formattedParticipants,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    console.error('Fetch admin actions error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch admin participant actions.' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

