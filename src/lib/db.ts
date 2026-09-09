import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

function getDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL;
  if (envUrl && !envUrl.startsWith('file:')) {
    return envUrl;
  }

  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    const tmpDbPath = path.join('/tmp', 'dev.db');
    try {
      if (!fs.existsSync(tmpDbPath)) {
        const sourceDb = path.join(process.cwd(), 'prisma', 'dev.db');
        if (fs.existsSync(sourceDb)) {
          const tmpDir = path.dirname(tmpDbPath);
          if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
          }
          fs.copyFileSync(sourceDb, tmpDbPath);
          try {
            fs.chmodSync(tmpDbPath, 0o666);
          } catch (e) {
            // Ignore chmod on environments that don't support it
          }
        }
      }
      return `file:${tmpDbPath}`;
    } catch (err) {
      console.error('Failed to setup /tmp/dev.db on Vercel:', err);
    }
  }

  return envUrl || 'file:./dev.db';
}

const activeDbUrl = getDatabaseUrl();
process.env.DATABASE_URL = activeDbUrl;

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: activeDbUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
