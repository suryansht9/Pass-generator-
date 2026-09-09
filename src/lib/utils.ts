import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format participant ID e.g. CFC-2026-0001
 */
export function formatParticipantId(num: number): string {
  const padded = String(num).padStart(4, '0');
  return `CFC-2026-${padded}`;
}

/**
 * Generate unique random verification token
 */
export function generateVerificationToken(): string {
  return 'cfc_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
}

/**
 * Generate unique access code e.g. CFC-9821-X3
 */
export function generateRandomAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CFC-${rand}-${Math.floor(10 + Math.random() * 90)}`;
}

/**
 * Base URL for the app (used in QR codes)
 */
export function getAppBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}
