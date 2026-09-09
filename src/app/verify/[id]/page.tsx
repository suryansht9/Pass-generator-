'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, AlertTriangle, ShieldX, User, Building, Users, Award, Calendar, ArrowLeft, Loader2 } from 'lucide-react';

interface VerificationResult {
  status: 'VALID' | 'REVOKED' | 'INVALID' | 'ERROR';
  message?: string;
  participant?: {
    participantId: string;
    fullName: string;
    collegeName: string;
    teamName: string;
    photoUrl: string;
    status: string;
    createdAt?: string;
  };
}

export default function PublicVerifyPage({ params }: { params: { id: string } }) {
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyPass() {
      try {
        setLoading(true);
        const res = await fetch(`/api/verify/${encodeURIComponent(params.id)}`);
        const data = await res.json();
        setResult(data);
      } catch (err) {
        console.error('Verification error:', err);
        setResult({ status: 'ERROR', message: 'Failed to connect to verification server' });
      } finally {
        setLoading(false);
      }
    }

    verifyPass();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-brand-red animate-spin mb-3" />
        <p className="text-sm font-mono text-gray-400">Verifying pass credentials...</p>
      </div>
    );
  }

  const status = result?.status || 'INVALID';
  const participant = result?.participant;

  return (
    <div className="py-10 px-4 sm:px-6 max-w-lg mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Home</span>
        </Link>
        <span className="text-[11px] font-mono text-gray-500">CMP × GDG • 18 SEP</span>
      </div>

      {/* Main Verification Result Card */}
      <div className="bg-brand-card border border-brand-border rounded-3xl overflow-hidden shadow-2xl space-y-0">
        {/* STATUS HEADER BANNER */}
        {status === 'VALID' && (
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-center text-white space-y-2">
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto border border-white/30 shadow-lg">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-display font-black text-2xl tracking-wide uppercase">✓ PASS VERIFIED</h1>
            <p className="text-xs font-mono text-emerald-100 uppercase tracking-widest font-semibold">
              VALID OFFICIAL PARTICIPANT PASS
            </p>
          </div>
        )}

        {status === 'REVOKED' && (
          <div className="bg-gradient-to-r from-amber-600 to-orange-700 p-6 text-center text-white space-y-2">
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto border border-white/30 shadow-lg">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-display font-black text-2xl tracking-wide uppercase">⚠ PASS REVOKED</h1>
            <p className="text-xs font-mono text-amber-100 uppercase tracking-widest font-semibold">
              THIS PASS HAS BEEN REVOKED BY ORGANIZERS
            </p>
          </div>
        )}

        {(status === 'INVALID' || status === 'ERROR') && (
          <div className="bg-gradient-to-r from-rose-700 to-red-900 p-6 text-center text-white space-y-2">
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto border border-white/30 shadow-lg">
              <ShieldX className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-display font-black text-2xl tracking-wide uppercase">✕ INVALID PASS</h1>
            <p className="text-xs font-mono text-rose-200 uppercase tracking-widest font-semibold">
              NOT A VALID HACKATHON PARTICIPANT ID
            </p>
          </div>
        )}

        {/* EVENT BRANDING SUBHEADER */}
        <div className="bg-brand-dark p-4 border-b border-brand-border/60 text-center space-y-1">
          <div className="font-display font-bold text-base text-white">CODE FOR COMMUNITY HACKATHON</div>
          <div className="flex items-center justify-center gap-2 text-xs font-mono text-brand-muted">
            <span className="text-red-400 font-bold">CMP × GDG</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-gray-300">
              <Calendar className="w-3 h-3 text-red-400" />
              18 SEPTEMBER
            </span>
          </div>
        </div>

        {/* PARTICIPANT DETAILS (IF VALID OR REVOKED) */}
        {participant ? (
          <div className="p-6 space-y-6">
            {/* Participant Photo */}
            <div className="flex justify-center">
              <div className="w-28 h-28 rounded-2xl p-1 bg-gradient-to-tr from-brand-red to-gray-700 shadow-xl overflow-hidden">
                <img
                  src={participant.photoUrl || '/avatar-placeholder.png'}
                  alt={participant.fullName}
                  className="w-full h-full object-cover rounded-xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://ui-avatars.com/api/?name=' +
                      encodeURIComponent(participant.fullName) +
                      '&background=111318&color=fff&size=200';
                  }}
                />
              </div>
            </div>

            <div className="divide-y divide-brand-border/60 space-y-3">
              {/* Name */}
              <div className="pt-2 flex items-center justify-between">
                <div className="text-xs font-mono text-gray-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-brand-red" />
                  PARTICIPANT
                </div>
                <div className="font-bold text-base text-white">{participant.fullName}</div>
              </div>

              {/* College */}
              <div className="pt-3 flex items-center justify-between">
                <div className="text-xs font-mono text-gray-400 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-brand-red" />
                  COLLEGE
                </div>
                <div className="font-semibold text-sm text-gray-200 text-right">{participant.collegeName}</div>
              </div>

              {/* Team */}
              <div className="pt-3 flex items-center justify-between">
                <div className="text-xs font-mono text-gray-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-brand-red" />
                  TEAM
                </div>
                <div className="font-semibold text-sm text-gray-200">{participant.teamName}</div>
              </div>

              {/* ID */}
              <div className="pt-3 flex items-center justify-between">
                <div className="text-xs font-mono text-gray-400 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-brand-red" />
                  PARTICIPANT ID
                </div>
                <div className="font-mono font-bold text-sm text-red-400">{participant.participantId}</div>
              </div>

              {/* STATUS */}
              <div className="pt-3 flex items-center justify-between">
                <div className="text-xs font-mono text-gray-400">STATUS</div>
                <div>
                  {status === 'VALID' ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
                      VALID
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-mono font-bold">
                      REVOKED
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center space-y-3">
            <p className="text-sm text-gray-400">
              No participant record matches this ID or verification link. Please ensure the QR code was scanned correctly.
            </p>
          </div>
        )}

        {/* FOOTER */}
        <div className="bg-brand-dark p-4 border-t border-brand-border/60 text-center">
          <p className="text-[11px] text-gray-400 font-mono">
            Official participant pass • CMP Hack Squad × GDG Prayagraj
          </p>
        </div>
      </div>
    </div>
  );
}
