import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

export interface PersistedParticipant {
  id: string;
  fullName: string;
  collegeName: string;
  teamName: string;
  email: string;
  phone?: string | null;
  accessCode?: string | null;
  status: string;
  claimedAt?: string | null;
  participantId?: string | null;
  checkedIn: boolean;
  checkedInAt?: string | null;
  foodPassGenerated: boolean;
  foodPassGeneratedAt?: string | null;
  foodPassId?: string | null;
  foodReceived: boolean;
  foodReceivedAt?: string | null;
  createdAt: string;
}

// Default seed participants to ensure base participants are always available
const SEED_PARTICIPANTS: PersistedParticipant[] = [
  {
    id: 'seed-1',
    email: 'rahul.sharma@example.com',
    fullName: 'Rahul Sharma',
    collegeName: 'CMP Degree College',
    teamName: 'Code Warriors',
    accessCode: 'CFC-PASS-2026',
    status: 'PENDING',
    checkedIn: false,
    foodPassGenerated: false,
    foodReceived: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-2',
    email: 'priya.patel@example.com',
    fullName: 'Priya Patel',
    collegeName: 'University of Allahabad',
    teamName: 'Tech Titans',
    accessCode: 'VIP-CMP-GDG',
    status: 'PENDING',
    checkedIn: false,
    foodPassGenerated: false,
    foodReceived: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-3',
    email: 'amit.kumar@example.com',
    fullName: 'Amit Kumar',
    collegeName: 'MNNIT Allahabad',
    teamName: 'Dev Squad',
    accessCode: 'HACK-2026-001',
    status: 'PENDING',
    checkedIn: false,
    foodPassGenerated: false,
    foodReceived: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-4',
    email: 'sneha.verma@example.com',
    fullName: 'Sneha Verma',
    collegeName: 'CMP Degree College',
    teamName: 'Binary Hackers',
    accessCode: 'HACK-2026-002',
    status: 'PENDING',
    checkedIn: false,
    foodPassGenerated: false,
    foodReceived: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-5',
    email: 'vikram.singh@example.com',
    fullName: 'Vikram Singh',
    collegeName: 'IIIT Allahabad',
    teamName: 'Cyber Knights',
    accessCode: 'HACK-2026-003',
    status: 'PENDING',
    checkedIn: false,
    foodPassGenerated: false,
    foodReceived: false,
    createdAt: new Date().toISOString(),
  },
];

function getStoreFilePaths(): string[] {
  const paths: string[] = [];
  try {
    paths.push(path.join(process.cwd(), 'prisma', 'whitelist_store.json'));
  } catch (e) {
    // Ignore cwd error if any
  }
  if (process.env.VERCEL) {
    paths.push(path.join('/tmp', 'whitelist_store.json'));
  }
  return paths;
}

export function getPersistedList(): PersistedParticipant[] {
  const paths = getStoreFilePaths();
  for (const filePath of paths) {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      // Try next path
    }
  }
  return SEED_PARTICIPANTS;
}

export function savePersistedParticipant(item: any): void {
  try {
    const list = getPersistedList();
    const emailNorm = item.email ? item.email.trim().toLowerCase() : '';

    const existingIndex = list.findIndex(
      (p) => p.id === item.id || (emailNorm && p.email?.trim().toLowerCase() === emailNorm)
    );

    const recordToSave: PersistedParticipant = {
      id: item.id || `wh-${Date.now()}`,
      fullName: item.fullName || 'Selected Participant',
      collegeName: item.collegeName || 'CMP College',
      teamName: item.teamName || 'Independent Team',
      email: emailNorm || item.email,
      phone: item.phone || null,
      accessCode: item.accessCode || null,
      status: item.status || 'PENDING',
      claimedAt: item.claimedAt ? new Date(item.claimedAt).toISOString() : null,
      participantId: item.participantId || null,
      checkedIn: Boolean(item.checkedIn),
      checkedInAt: item.checkedInAt ? new Date(item.checkedInAt).toISOString() : null,
      foodPassGenerated: Boolean(item.foodPassGenerated),
      foodPassGeneratedAt: item.foodPassGeneratedAt ? new Date(item.foodPassGeneratedAt).toISOString() : null,
      foodPassId: item.foodPassId || null,
      foodReceived: Boolean(item.foodReceived),
      foodReceivedAt: item.foodReceivedAt ? new Date(item.foodReceivedAt).toISOString() : null,
      createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...recordToSave };
    } else {
      list.unshift(recordToSave);
    }

    writeToFiles(list);
  } catch (err) {
    console.error('Failed to save persisted participant:', err);
  }
}

export function removePersistedParticipant(idOrEmail: string): void {
  try {
    const list = getPersistedList();
    const targetNorm = idOrEmail.trim().toLowerCase();

    const filtered = list.filter(
      (p) => p.id !== idOrEmail && p.email?.trim().toLowerCase() !== targetNorm
    );

    writeToFiles(filtered);
  } catch (err) {
    console.error('Failed to remove persisted participant:', err);
  }
}

function writeToFiles(list: PersistedParticipant[]): void {
  const paths = getStoreFilePaths();
  const content = JSON.stringify(list, null, 2);

  for (const filePath of paths) {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, content, 'utf-8');
    } catch (err) {
      // Ignore write errors to read-only directories
    }
  }
}

let syncInProgress = false;

export async function syncPersistentWhitelist(prisma: PrismaClient): Promise<void> {
  if (syncInProgress) return;
  syncInProgress = true;

  try {
    const list = getPersistedList();

    for (const item of list) {
      if (!item.email || !item.email.trim()) continue;
      const emailNorm = item.email.trim().toLowerCase();

      const existing = await prisma.whitelistParticipant.findFirst({
        where: { email: emailNorm },
      });

      if (!existing) {
        await prisma.whitelistParticipant.create({
          data: {
            id: item.id,
            email: emailNorm,
            fullName: item.fullName,
            collegeName: item.collegeName,
            teamName: item.teamName,
            accessCode: item.accessCode || undefined,
            status: item.status || 'PENDING',
            claimedAt: item.claimedAt ? new Date(item.claimedAt) : undefined,
            participantId: item.participantId || undefined,
            checkedIn: item.checkedIn,
            checkedInAt: item.checkedInAt ? new Date(item.checkedInAt) : undefined,
            foodPassGenerated: item.foodPassGenerated,
            foodPassGeneratedAt: item.foodPassGeneratedAt ? new Date(item.foodPassGeneratedAt) : undefined,
            foodPassId: item.foodPassId || undefined,
            foodReceived: item.foodReceived,
            foodReceivedAt: item.foodReceivedAt ? new Date(item.foodReceivedAt) : undefined,
            createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
          },
        });
      }
    }
  } catch (err) {
    console.error('Whitelist persistent sync error:', err);
  } finally {
    syncInProgress = false;
  }
}
