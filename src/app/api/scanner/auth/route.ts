import { NextRequest, NextResponse } from 'next/server';
import { createScannerToken, isScannerAuthenticated, SCANNER_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    const token = createScannerToken(password);

    if (!token) {
      return NextResponse.json(
        { error: 'Incorrect password. Access denied.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true, message: 'Authenticated successfully' });

    response.cookies.set({
      name: SCANNER_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Scanner auth error:', error);
    return NextResponse.json({ error: 'Authentication server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const authenticated = await isScannerAuthenticated();
    return NextResponse.json({ authenticated });
  } catch (error) {
    return NextResponse.json({ authenticated: false });
  }
}
