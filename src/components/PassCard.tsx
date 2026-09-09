'use client';

import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { getAppBaseUrl } from '@/lib/utils';
import { CheckCircle2, ShieldX, User, Building, Users, Calendar, Award } from 'lucide-react';

export interface ParticipantPassData {
  participantId: string;
  fullName: string;
  collegeName: string;
  teamName: string;
  photoUrl: string;
  verificationToken?: string;
  status: 'ACTIVE' | 'REVOKED' | string;
  createdAt?: string | Date;
}

interface PassCardProps {
  participant: ParticipantPassData;
  idForExport?: string;
}

export default function PassCard({ participant, idForExport = 'hackathon-digital-pass' }: PassCardProps) {
  const [baseUrl, setBaseUrl] = useState('http://localhost:3000');

  useEffect(() => {
    setBaseUrl(getAppBaseUrl());
  }, []);

  const verificationUrl = `${baseUrl}/verify/${participant.participantId}`;
  const isValid = participant.status === 'ACTIVE';

  return (
    <div className="w-full flex justify-center py-4">
      {/* Outer Horizontal Ticket Container */}
      <div
        id={idForExport}
        className="w-full max-w-[850px] relative bg-[#080808] rounded-2xl overflow-hidden shadow-2xl border border-[#22242B] flex flex-col md:flex-row text-white select-none transition-all"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 30px rgba(239, 29, 37, 0.2)',
        }}
      >
        {/* Ticket Perforated Semicircle Cutouts */}
        <div className="hidden md:block absolute top-0 left-[35%] -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#080808] border border-[#22242B] z-20" />
        <div className="hidden md:block absolute bottom-0 left-[35%] -translate-x-1/2 translate-y-1/2 w-7 h-7 rounded-full bg-[#080808] border border-[#22242B] z-20" />

        {/* LEFT TICKET SECTION (Red Gradient) */}
        <div className="md:w-[35%] bg-gradient-to-b from-[#EF1D25] via-[#C00D14] to-[#7A080D] p-6 flex flex-col items-center justify-between relative overflow-hidden border-b md:border-b-0 md:border-r border-white/10">
          {/* Subtle Technical Grid Lines */}
          <div className="absolute inset-0 opacity-10 bg-tech-grid pointer-events-none" />

          {/* Ticket Header & Logo */}
          <div className="w-full flex flex-col items-center gap-1.5 z-10">
            <div className="w-10 h-10 p-1 bg-white rounded-xl shadow-lg">
              <img
                src="/cmp-logo.png"
                alt="CMP Hack Squad Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="px-3 py-0.5 rounded-full bg-black/40 border border-white/20 text-[10px] font-mono font-bold tracking-widest uppercase text-white">
              OFFICIAL ENTRY PASS
            </div>
          </div>

          {/* Participant Photo - Event Portrait Area */}
          <div className="my-4 z-10 flex flex-col items-center">
            <div className="w-28 h-32 sm:w-32 sm:h-36 rounded-xl p-1 bg-gradient-to-b from-white/40 to-white/10 shadow-2xl overflow-hidden relative border border-white/30">
              <img
                src={participant.photoUrl || '/avatar-placeholder.png'}
                alt={participant.fullName}
                className="w-full h-full object-cover rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://ui-avatars.com/api/?name=' +
                    encodeURIComponent(participant.fullName) +
                    '&background=080808&color=fff&size=200';
                }}
              />
            </div>
          </div>

          {/* Vector QR Code */}
          <div className="z-10 bg-white p-2.5 rounded-xl shadow-2xl border border-black/20 flex flex-col items-center">
            <QRCodeSVG value={verificationUrl} size={105} level="H" includeMargin={false} />
            <div className="mt-1 text-[9px] font-mono text-gray-800 tracking-tighter text-center uppercase font-bold">
              SCAN TO VERIFY
            </div>
          </div>

          {/* Participant ID Badge */}
          <div className="mt-3 z-10 w-full text-center">
            <div className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/15 text-xs sm:text-sm font-mono font-bold tracking-widest text-red-200">
              {participant.participantId}
            </div>
          </div>
        </div>

        {/* PERFORATED DASHED LINE */}
        <div className="hidden md:flex flex-col justify-between items-center w-[1px] relative z-10">
          <div className="w-full h-full border-r-2 border-dashed border-white/20" />
        </div>

        {/* RIGHT TICKET SECTION (Deep Charcoal) */}
        <div className="md:w-[65%] bg-gradient-to-br from-[#141416] via-[#0E0E10] to-[#080808] p-6 sm:p-8 flex flex-col justify-between relative">
          <div className="absolute inset-0 bg-tech-grid opacity-15 pointer-events-none" />

          {/* Event Header */}
          <div className="z-10 space-y-2 border-b border-white/10 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-mono text-brand-red font-bold tracking-widest uppercase">
                  CMP HACK SQUAD PRESENTS
                </div>
                <h2 className="font-display font-black text-2xl sm:text-3xl tracking-tight leading-none text-white pt-1">
                  CODE FOR <span className="text-brand-red">COMMUNITY</span> HACKATHON
                </h2>
              </div>

              {/* Status Badge */}
              <div>
                {isValid ? (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>VALID PASS</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono font-bold">
                    <ShieldX className="w-3.5 h-3.5" />
                    <span>PASS REVOKED</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono text-gray-400 pt-1">
              <span className="px-2 py-0.5 rounded bg-white/10 text-white font-bold">CMP × GDG</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-red-400 font-bold">
                <Calendar className="w-3.5 h-3.5" />
                18 SEPTEMBER 2026
              </span>
            </div>
          </div>

          {/* Participant Details Block */}
          <div className="z-10 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <User className="w-3 h-3 text-brand-red" />
                Participant Name
              </div>
              <div className="font-bold text-base sm:text-lg text-white truncate">
                {participant.fullName}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Building className="w-3 h-3 text-brand-red" />
                College Name
              </div>
              <div className="font-semibold text-sm sm:text-base text-gray-200 truncate">
                {participant.collegeName}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3 h-3 text-brand-red" />
                Team Name
              </div>
              <div className="font-semibold text-sm sm:text-base text-gray-200 truncate">
                {participant.teamName}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Award className="w-3 h-3 text-brand-red" />
                Access Type
              </div>
              <div className="font-bold text-xs text-emerald-400 font-mono">
                CONFIRMED PARTICIPANT
              </div>
            </div>
          </div>

          {/* Organizer Credits Footer */}
          <div className="z-10 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-gray-400 gap-2 font-mono">
            <div>
              <span className="text-gray-500">Organized by: </span>
              <strong className="text-white">CMP Hack Squad</strong>
            </div>
            <div>
              <span className="text-gray-500">In collaboration with: </span>
              <strong className="text-white">GDG Prayagraj</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
