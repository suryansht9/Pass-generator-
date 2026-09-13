import { PrismaClient } from '@prisma/client';
import path from 'path';

function getDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL;

  // If a PostgreSQL / MySQL / Supabase URL is specified, use it directly
  if (envUrl && !envUrl.startsWith('file:')) {
    return envUrl;
  }

  // For local SQLite, use absolute path to prisma/dev.db to prevent path mismatches on Windows/Linux
  const dbPath = path.resolve(process.cwd(), 'prisma', 'dev.db').replace(/\\/g, '/');
  return `file:${dbPath}`;
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


