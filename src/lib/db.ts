import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Handle Vercel serverless environment with SQLite
if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
  const currentDbUrl = process.env.DATABASE_URL || 'file:./dev.db';
  if (currentDbUrl.startsWith('file:')) {
    const tmpDbPath = '/tmp/dev.db';
    try {
      if (!fs.existsSync(tmpDbPath)) {
        const sourceDb = path.join(process.cwd(), 'prisma', 'dev.db');
        if (fs.existsSync(sourceDb)) {
          fs.copyFileSync(sourceDb, tmpDbPath);
        }
      }
      process.env.DATABASE_URL = `file:${tmpDbPath}`;
    } catch (err) {
      console.error('Vercel DB initialization warning:', err);
    }
  }
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
