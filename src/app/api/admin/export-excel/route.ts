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

    const whitelist = await prisma.whitelistParticipant.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Generate CSV data with UTF-8 BOM for Excel compatibility
    const headers = [
      'Participant ID',
      'Name',
      'Email',
      'College',
      'Team',
      'Main Pass Generated',
      'Check-in Status',
      'Food Pass Generated',
      'Food Pass ID',
      'Food Received Status',
    ];

    const rows = whitelist.map((item) => [
      item.participantId || '—',
      `"${(item.fullName || '').replace(/"/g, '""')}"`,
      `"${(item.email || '').replace(/"/g, '""')}"`,
      `"${(item.collegeName || '').replace(/"/g, '""')}"`,
      `"${(item.teamName || '').replace(/"/g, '""')}"`,
      item.status === 'CLAIMED' ? 'Yes' : 'No',
      item.checkedIn ? 'Yes' : 'No',
      item.foodPassGenerated ? 'Yes' : 'No',
      item.foodPassId || '—',
      item.foodReceived ? 'Yes' : 'No',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="Code_For_Community_Participants_${Date.now()}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('Export excel error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to export data' }, { status: 500 });
  }
}
