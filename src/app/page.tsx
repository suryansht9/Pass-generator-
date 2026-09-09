'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Ticket,
  QrCode,
  ArrowRight,
  Calendar,
  Users,
  Award,
  Building,
  CheckCircle2,
  ShieldCheck,
  Code2,
  Terminal,
  Scan,
  UserCheck,
  ExternalLink,
} from 'lucide-react';

export default function HomePage() {
  const [quickVerifyId, setQuickVerifyId] = useState('');

  const handleQuickVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickVerifyId.trim()) {
      window.location.href = `/verify/${encodeURIComponent(quickVerifyId.trim())}`;
    }
  };

  return (
    <div className="relative overflow-hidden bg-[#080808]">
      {/* Background Technical Grid */}
      <div className="absolute inset-0 bg-tech-grid opacity-30 pointer-events-none -z-10" />

      {/* Subtle Red Top Gradient Accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-brand-red/15 via-brand-red/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* HERO SECTION */}
      <section className="pt-12 pb-20 sm:pt-20 sm:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          {/* Official CMP Hack Squad Logo Anchor */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 sm:w-24 sm:h-24 p-2 bg-[#111111] rounded-2xl border border-[#22242B] shadow-2xl flex items-center justify-center">
              <img
                src="/cmp-logo.png"
                alt="CMP Hack Squad Official Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest pt-1">
              ORGANIZED BY <span className="text-white">CMP HACK SQUAD</span>
            </div>
          </div>

          {/* Main Title & Event Metadata */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#141416] border border-[#22242B] text-xs font-mono text-gray-300">
              <span className="w-2 h-2 rounded-full bg-brand-red animate-pulse" />
              <span>CMP HACK SQUAD</span>
              <span className="text-gray-500">×</span>
              <span className="text-brand-red font-bold">GDG PRAYAGRAJ</span>
            </div>

            <h1 className="font-display font-black text-4xl sm:text-6xl md:text-7xl tracking-tight leading-none text-white">
              CODE FOR <br />
              <span className="text-brand-red">COMMUNITY</span> HACKATHON
            </h1>

            <div className="flex items-center justify-center gap-3 font-mono text-sm sm:text-base pt-2">
              <span className="px-3 py-1 bg-white/10 text-white font-bold rounded">
                CMP × GDG
              </span>
              <span className="text-gray-600">•</span>
              <span className="text-brand-red font-bold flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                18 SEPTEMBER 2026
              </span>
            </div>

            <p className="text-lg sm:text-2xl text-gray-300 font-medium italic pt-2">
              &quot;Build. Collaborate. Solve for Community.&quot;
            </p>

            <p className="text-xs sm:text-sm text-gray-400 font-mono">
              CMP Hack Squad × GDG Prayagraj Official Participant Pass Portal
            </p>
          </div>

          {/* Primary & Secondary Action CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-brand-red hover:bg-red-600 text-white font-mono font-bold text-sm tracking-wider rounded-xl transition-all shadow-xl shadow-brand-red/20 transform hover:-translate-y-0.5"
            >
              <Ticket className="w-5 h-5" />
              <span>GENERATE MY PASS</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/scanner"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#141416] hover:bg-white/10 text-white font-mono font-bold text-sm tracking-wider rounded-xl border border-[#22242B] transition-all transform hover:-translate-y-0.5"
            >
              <QrCode className="w-5 h-5 text-brand-red" />
              <span>VERIFY A PASS</span>
            </Link>
          </div>

          {/* Quick Lookup Input */}
          <div className="pt-6 max-w-md mx-auto">
            <form onSubmit={handleQuickVerify} className="relative flex items-center">
              <input
                type="text"
                placeholder="Enter Participant ID (e.g. CFC-2026-0001)"
                value={quickVerifyId}
                onChange={(e) => setQuickVerifyId(e.target.value)}
                className="w-full pl-4 pr-24 py-3 bg-[#141416] border border-[#22242B] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-red font-mono"
              />
              <button
                type="submit"
                className="absolute right-1.5 px-4 py-1.5 bg-brand-red hover:bg-red-600 text-white text-xs font-mono font-bold rounded-lg transition-colors"
              >
                VERIFY
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* SECTION 1: ABOUT THE HACKATHON */}
      <section className="py-16 bg-[#0E0E10] border-t border-[#22242B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto space-y-4 text-center">
            <div className="text-xs font-mono font-bold text-brand-red uppercase tracking-widest">
              ABOUT THE HACKATHON
            </div>
            <h2 className="font-display font-black text-2xl sm:text-4xl text-white tracking-tight">
              Solving Real Challenges Through Code
            </h2>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed pt-2">
              Code for Community Hackathon is a collaborative coding event organized by{' '}
              <strong className="text-white">CMP Hack Squad</strong> in collaboration with{' '}
              <strong className="text-white">GDG Prayagraj</strong>, bringing student developers together to build meaningful technology-driven solutions for real community challenges.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 2: EVENT DETAILS GRID */}
      <section className="py-16 bg-[#080808] border-t border-[#22242B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <div className="text-xs font-mono font-bold text-brand-red uppercase tracking-widest">
              EVENT SPECIFICATIONS
            </div>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-white">
              Official Hackathon Details
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#141416] p-6 rounded-2xl border border-[#22242B] space-y-2">
              <div className="text-xs font-mono text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-red" />
                DATE
              </div>
              <div className="font-display font-bold text-xl text-white">18 SEPTEMBER 2026</div>
              <div className="text-xs font-mono text-gray-400">Single-day event</div>
            </div>

            <div className="bg-[#141416] p-6 rounded-2xl border border-[#22242B] space-y-2">
              <div className="text-xs font-mono text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Building className="w-4 h-4 text-brand-red" />
                ORGANIZED BY
              </div>
              <div className="font-display font-bold text-xl text-white">CMP Hack Squad</div>
              <div className="text-xs font-mono text-gray-400">Primary Organizer</div>
            </div>

            <div className="bg-[#141416] p-6 rounded-2xl border border-[#22242B] space-y-2">
              <div className="text-xs font-mono text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Code2 className="w-4 h-4 text-brand-red" />
                IN COLLABORATION WITH
              </div>
              <div className="font-display font-bold text-xl text-white">GDG Prayagraj</div>
              <div className="text-xs font-mono text-gray-400">Community Partner</div>
            </div>

            <div className="bg-[#141416] p-6 rounded-2xl border border-[#22242B] space-y-2">
              <div className="text-xs font-mono text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-red" />
                PARTICIPANTS
              </div>
              <div className="font-display font-bold text-xl text-white">200 SELECTED</div>
              <div className="text-xs font-mono text-gray-400">Strictly pre-registered</div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: PARTICIPANT DIGITAL PASS SHOWCASE */}
      <section className="py-16 bg-[#0E0E10] border-t border-[#22242B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="space-y-4 max-w-xl text-center lg:text-left">
              <div className="text-xs font-mono font-bold text-brand-red uppercase tracking-widest">
                YOUR DIGITAL HACKATHON PASS
              </div>
              <h2 className="font-display font-black text-3xl sm:text-4xl text-white leading-tight">
                Personalized Scannable Entry Ticket
              </h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                Generate your official Code for Community Hackathon participant pass and keep it ready for event entrance verification.
              </p>
              <div className="pt-2">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-brand-red hover:bg-red-600 text-white font-mono text-xs font-bold rounded-xl transition-colors"
                >
                  <Ticket className="w-4 h-4" />
                  <span>GENERATE MY PASS</span>
                </Link>
              </div>
            </div>

            {/* Mini Pass Visual Presentation */}
            <div className="w-full max-w-md bg-[#141416] border border-[#22242B] p-6 rounded-2xl shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#22242B] pb-3">
                <div className="flex items-center gap-2">
                  <img src="/cmp-logo.png" alt="Logo" className="w-6 h-6 object-contain" />
                  <span className="font-display font-bold text-xs text-white">HACKATHON PASS</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">
                  VALID PASS
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-20 rounded-lg bg-gray-800 border border-white/10 flex items-center justify-center text-xs text-gray-400 font-mono">
                  PHOTO
                </div>
                <div className="space-y-1 text-xs font-mono">
                  <div className="text-white font-bold">Rahul Sharma</div>
                  <div className="text-gray-400 text-[11px]">CMP Degree College</div>
                  <div className="text-brand-red font-bold text-[11px]">CFC-2026-0001</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: VERIFY. SCAN. ENTER. */}
      <section className="py-16 bg-[#080808] border-t border-[#22242B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <div className="text-xs font-mono font-bold text-brand-red uppercase tracking-widest">
              ENTRY VERIFICATION FLOW
            </div>
            <h2 className="font-display font-black text-3xl text-white">VERIFY. SCAN. ENTER.</h2>
            <p className="text-sm text-gray-400">
              Every participant receives a unique QR-powered digital pass. Organizers can scan the QR code to instantly verify participant details.
            </p>
          </div>

          {/* 4 Step Visual Flow */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center font-mono">
            <div className="bg-[#141416] p-6 rounded-2xl border border-[#22242B] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-red/10 border border-brand-red/30 flex items-center justify-center text-brand-red mx-auto font-bold text-sm">
                01
              </div>
              <h3 className="font-bold text-sm text-white">QR CODE</h3>
              <p className="text-xs text-gray-400">Unique vector QR generated for confirmed participants.</p>
            </div>

            <div className="bg-[#141416] p-6 rounded-2xl border border-[#22242B] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-red/10 border border-brand-red/30 flex items-center justify-center text-brand-red mx-auto font-bold text-sm">
                02
              </div>
              <h3 className="font-bold text-sm text-white">SCAN</h3>
              <p className="text-xs text-gray-400">Organizers scan QR using smartphone camera.</p>
            </div>

            <div className="bg-[#141416] p-6 rounded-2xl border border-[#22242B] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-red/10 border border-brand-red/30 flex items-center justify-center text-brand-red mx-auto font-bold text-sm">
                03
              </div>
              <h3 className="font-bold text-sm text-white">VERIFY</h3>
              <p className="text-xs text-gray-400">Real-time status check against database record.</p>
            </div>

            <div className="bg-[#141416] p-6 rounded-2xl border border-[#22242B] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-red/10 border border-brand-red/30 flex items-center justify-center text-brand-red mx-auto font-bold text-sm">
                04
              </div>
              <h3 className="font-bold text-sm text-white">ENTRY</h3>
              <p className="text-xs text-gray-400">Instant gate entry confirmation for participant.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
