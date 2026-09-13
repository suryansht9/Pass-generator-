import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch latest participant records directly from database (single source of truth)
    const whitelist = await prisma.whitelistParticipant.findMany({
      orderBy: { createdAt: 'desc' },
    });


    const formatDate = (dateVal?: Date | null) => {
      if (!dateVal) return '—';
      return new Date(dateVal).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    };

    // Structure rows for Excel sheet with action statuses and timestamps
    const excelRows = whitelist.map((item) => {
      const isMainPassGenerated = item.status === 'CLAIMED' || Boolean(item.participantId);
      const isEntryCheckedIn = Boolean(item.checkedIn);
      const isFoodPassGenerated = Boolean(item.foodPassGenerated);
      const isFoodReceived = Boolean(item.foodReceived);

      return {
        'Participant ID': item.participantId || '—',
        'Full Name': item.fullName || '—',
        'Email Address': item.email || '—',
        'College Name': item.collegeName || '—',
        'Team Name': item.teamName || '—',
        'Main Pass ID': item.participantId || '—',
        'Main Pass Generated': isMainPassGenerated ? '☑ YES' : '☐ NO',
        'Main Pass Generated At': isMainPassGenerated ? formatDate(item.claimedAt) : '—',
        'Entry Check-in': isEntryCheckedIn ? '☑ YES' : '☐ NO',
        'Entry Check-in At': isEntryCheckedIn ? formatDate(item.checkedInAt) : '—',
        'Food Pass ID': item.foodPassId || '—',
        'Food Pass Generated': isFoodPassGenerated ? '☑ YES' : '☐ NO',
        'Food Pass Generated At': isFoodPassGenerated ? formatDate(item.foodPassGeneratedAt) : '—',
        'Food Received': isFoodReceived ? '☑ YES' : '☐ NO',
        'Food Received At': isFoodReceived ? formatDate(item.foodReceivedAt) : '—',
        'Registration Status': item.status || 'PENDING',
        'Registered At': formatDate(item.createdAt),
      };
    });

    // Create Excel Workbook and Sheet
    const worksheet = XLSX.utils.json_to_sheet(excelRows);

    // Auto-size column widths for clean presentation
    const columnWidths = [
      { wch: 18 }, // Participant ID
      { wch: 25 }, // Full Name
      { wch: 32 }, // Email Address
      { wch: 25 }, // College Name
      { wch: 20 }, // Team Name
      { wch: 18 }, // Main Pass ID
      { wch: 22 }, // Main Pass Generated
      { wch: 24 }, // Main Pass Generated At
      { wch: 18 }, // Entry Check-in
      { wch: 24 }, // Entry Check-in At
      { wch: 18 }, // Food Pass ID
      { wch: 22 }, // Food Pass Generated
      { wch: 24 }, // Food Pass Generated At
      { wch: 18 }, // Food Received
      { wch: 24 }, // Food Received At
      { wch: 20 }, // Registration Status
      { wch: 24 }, // Registered At
    ];
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Participant Action Log');

    // Generate binary buffer for native .xlsx file
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="CFC_Hackathon_Participant_Data.xlsx"',
      },
    });
  } catch (error: any) {
    console.error('Export Excel error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to export Excel data.' },
      { status: 500 }
    );
  }
}
