import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';
import { generateRandomAccessCode } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const codes = await prisma.accessCode.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, codes });
  } catch (error) {
    console.error('Fetch access codes error:', error);
    return NextResponse.json({ error: 'Failed to fetch access codes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const customCode = body.code ? body.code.trim().toUpperCase() : null;
    const count = Math.min(Math.max(body.count || 1, 1), 50);

    const createdCodes = [];

    if (customCode) {
      const existing = await prisma.accessCode.findUnique({ where: { code: customCode } });
      if (existing) {
        return NextResponse.json({ error: 'Access code already exists' }, { status: 400 });
      }
      const codeRecord = await prisma.accessCode.create({
        data: { code: customCode, status: 'ACTIVE' },
      });
      createdCodes.push(codeRecord);
    } else {
      for (let i = 0; i < count; i++) {
        let code = generateRandomAccessCode();
        while (await prisma.accessCode.findUnique({ where: { code } })) {
          code = generateRandomAccessCode();
        }
        const codeRecord = await prisma.accessCode.create({
          data: { code, status: 'ACTIVE' },
        });
        createdCodes.push(codeRecord);
      }
    }

    return NextResponse.json({ success: true, codes: createdCodes });
  } catch (error) {
    console.error('Create access code error:', error);
    return NextResponse.json({ error: 'Failed to create access code' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, status } = await req.json();

    if (!['ACTIVE', 'REVOKED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updated = await prisma.accessCode.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, code: updated });
  } catch (error) {
    console.error('Update access code error:', error);
    return NextResponse.json({ error: 'Failed to update access code' }, { status: 500 });
  }
}
