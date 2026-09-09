'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import PassCard, { ParticipantPassData } from '@/components/PassCard';
import PassExportActions from '@/components/PassExportActions';
import { ArrowLeft, Loader2, AlertCircle, Ticket } from 'lucide-react';

export default function PassViewPage({ params }: { params: { id: string } }) {
  const [participant, setParticipant] = useState<ParticipantPassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPass() {
      try {
        setLoading(true);
        const res = await fetch(`/api/pass/${encodeURIComponent(params.id)}`);
        const data = await res.json();

        if (!res.ok || !data.participant) {
          throw new Error(data.error || 'Participant pass not found');
        }

        setParticipant(data.participant);
      } catch (err: any) {
        console.error('Fetch pass error:', err);
        setError(err.message || 'Failed to load pass details');
      } finally {
        setLoading(false);
      }
    }

    fetchPass();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-brand-red animate-spin" />
        <p className="text-sm font-mono text-gray-400">Loading your hackathon pass...</p>
      </div>
    );
  }

  if (error || !participant) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center max-w-md mx-auto px-4 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="font-display font-bold text-2xl text-white">Pass Not Found</h1>
        <p className="text-sm text-gray-400">{error || 'No participant found with this ID.'}</p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-red hover:bg-red-600 text-white font-bold text-sm transition-colors"
        >
          <Ticket className="w-4 h-4" />
          <span>Generate New Pass</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-red/10 border border-brand-red/30 text-xs font-mono text-red-400">
          <span>STATUS: {participant.status}</span>
        </div>
      </div>

      {/* Main Pass Rendering Component */}
      <PassCard participant={participant} idForExport="hackathon-digital-pass" />

      {/* Export & Action Buttons */}
      <PassExportActions
        participantId={participant.participantId}
        fullName={participant.fullName}
        passElementId="hackathon-digital-pass"
      />
    </div>
  );
}
