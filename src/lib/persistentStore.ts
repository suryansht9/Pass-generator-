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

export function getPersistedList(): PersistedParticipant[] {
  return [];
}

export function savePersistedParticipant(item: any): void {
  // Database is the single source of truth; no file store needed
}

export function removePersistedParticipant(idOrEmail: string): void {
  // Database is the single source of truth; no file store needed
}

export async function syncPersistentWhitelist(prisma: PrismaClient): Promise<void> {
  // Database is the single source of truth; no mock/seed sync
}

