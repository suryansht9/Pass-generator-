import { cookies } from 'next/headers';

const ADMIN_COOKIE_NAME = 'cfc_admin_token';
const ADMIN_SECRET = process.env.ADMIN_PASSWORD || 'adminpass123';

const SCANNER_COOKIE_NAME = 'cfc_scanner_token';
const SCANNER_SECRET = process.env.SCANNER_PASSWORD || 'verifypass123';

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return false;
  return token === Buffer.from(ADMIN_SECRET).toString('base64');
}

export function createAdminToken(password: string): string | null {
  const expectedPassword = process.env.ADMIN_PASSWORD || 'adminpass123';
  if (password === expectedPassword) {
    return Buffer.from(expectedPassword).toString('base64');
  }
  return null;
}

export async function isScannerAuthenticated(): Promise<boolean> {
  const cookieStore = cookies();
  const token = cookieStore.get(SCANNER_COOKIE_NAME)?.value;
  if (!token) return false;
  return token === Buffer.from(SCANNER_SECRET).toString('base64');
}

export function createScannerToken(password: string): string | null {
  const expectedPassword = process.env.SCANNER_PASSWORD || 'verifypass123';
  if (password === expectedPassword) {
    return Buffer.from(expectedPassword).toString('base64');
  }
  return null;
}

export { ADMIN_COOKIE_NAME, SCANNER_COOKIE_NAME };

