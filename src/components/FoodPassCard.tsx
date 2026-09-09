'use client';

import React, { useState } from 'react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { Download, FileText, Printer, Utensils, CheckCircle2, Calendar, User, Mail, Users, Award, Copy, Check } from 'lucide-react';

export interface FoodPassData {
  foodPassId: string;
  fullName: string;
  email: string;
  teamName: string;
  collegeName: string;
  participantId?: string;
  foodReceived?: boolean;
}

interface FoodPassCardProps {
  data: FoodPassData;
}

export default function FoodPassCard({ data }: FoodPassCardProps) {
  const [isGeneratingPng, setIsGeneratingPng] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copied, setCopied] = useState(false);

  const elementId = 'food-pass-ticket-card';

  // High-Res PNG Export
  const handleDownloadPng = async () => {
    try {
      setIsGeneratingPng(true);
      const element = document.getElementById(elementId);
      if (!element) return;

      const dataUrl = await toPng(element, {
        quality: 1.0,
        pixelRatio: 3,
        cacheBust: true,
      });

      const link = document.createElement('a');
      link.download = `${data.foodPassId}_FoodPass_${data.fullName.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export Food Pass PNG:', err);
    } finally {
      setIsGeneratingPng(false);
    }
  };

  // PDF Export
  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      const element = document.getElementById(elementId);
      if (!element) return;

      const dataUrl = await toPng(element, {
        quality: 0.98,
        pixelRatio: 2.5,
      });

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [800, 380],
      });

      pdf.addImage(dataUrl, 'PNG', 0, 0, 800, 380);
      pdf.save(`${data.foodPassId}_FoodPass_${data.fullName.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Failed to export Food Pass PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCopyId = async () => {
    await navigator.clipboard.writeText(data.foodPassId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="w-full max-w-[800px] mx-auto space-y-6">
      {/* TICKET PASS CONTAINER - NO QR CODE */}
      <div
        id={elementId}
        className="w-full relative bg-[#080808] rounded-2xl overflow-hidden shadow-2xl border border-[#22242B] flex flex-col md:flex-row text-white select-none transition-all"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 30px rgba(239, 29, 37, 0.2)',
        }}
      >
        {/* Ticket Perforated Cutouts */}
        <div className="hidden md:block absolute top-0 left-[32%] -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#080808] border border-[#22242B] z-20" />
        <div className="hidden md:block absolute bottom-0 left-[32%] -translate-x-1/2 translate-y-1/2 w-7 h-7 rounded-full bg-[#080808] border border-[#22242B] z-20" />

        {/* LEFT SECTION (Red Gradient Event Food Banner) */}
        <div className="md:w-[32%] bg-gradient-to-b from-[#EF1D25] via-[#C00D14] to-[#7A080D] p-6 flex flex-col items-center justify-between relative overflow-hidden border-b md:border-b-0 md:border-r border-white/10">
          <div className="absolute inset-0 bg-tech-grid opacity-15 pointer-events-none" />

          {/* Logo & Food Title */}
          <div className="w-full flex flex-col items-center gap-2 z-10 text-center">
            <div className="w-12 h-12 p-1.5 bg-white rounded-xl shadow-lg">
              <img src="/cmp-logo.png" alt="CMP Logo" className="w-full h-full object-contain" />
            </div>

            <div className="px-3 py-1 rounded-full bg-black/40 border border-white/20 text-[11px] font-mono font-bold tracking-widest uppercase text-white">
              FOOD PASS
            </div>
          </div>

          {/* Utensils Icon Centerpiece (No QR Code) */}
          <div className="my-6 z-10 flex flex-col items-center justify-center space-y-2">
            <div className="w-24 h-24 rounded-2xl bg-black/30 border border-white/20 backdrop-blur-md flex items-center justify-center shadow-xl">
              <Utensils className="w-12 h-12 text-white" />
            </div>
            <span className="text-[10px] font-mono text-red-200 tracking-wider font-bold uppercase">
              OFFICIAL MEAL TICKET
            </span>
          </div>

          {/* Food Pass ID Badge */}
          <div className="z-10 w-full text-center">
            <div className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 text-xs font-mono font-bold tracking-wider text-red-200 shadow-md">
              {data.foodPassId}
            </div>
          </div>
        </div>

        {/* PERFORATED DASHED DIVIDER */}
        <div className="hidden md:flex flex-col justify-between items-center w-[1px] relative z-10">
          <div className="w-full h-full border-r-2 border-dashed border-white/20" />
        </div>

        {/* RIGHT SECTION (Deep Charcoal Details) */}
        <div className="md:w-[68%] bg-gradient-to-br from-[#141416] via-[#0E0E10] to-[#080808] p-6 sm:p-8 flex flex-col justify-between relative">
          <div className="absolute inset-0 bg-tech-grid opacity-15 pointer-events-none" />

          {/* Header Typography */}
          <div className="z-10 space-y-2 border-b border-white/10 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-mono text-brand-red font-bold tracking-widest uppercase">
                  CMP HACK SQUAD × GDG PRAYAGRAJ
                </div>
                <h2 className="font-display font-black text-2xl sm:text-3xl tracking-tight leading-none text-white pt-1">
                  OFFICIAL <span className="text-brand-red">FOOD</span> PASS
                </h2>
              </div>

              <div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>VALID MEAL PASS</span>
                </div>
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

          {/* Details Grid */}
          <div className="z-10 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <User className="w-3 h-3 text-brand-red" />
                Participant Name
              </div>
              <div className="font-bold text-base sm:text-lg text-white truncate">
                {data.fullName}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Mail className="w-3 h-3 text-brand-red" />
                Registered Email
              </div>
              <div className="font-mono text-xs text-gray-200 truncate">
                {data.email}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3 h-3 text-brand-red" />
                Team Name
              </div>
              <div className="font-semibold text-sm text-gray-200 truncate">
                {data.teamName || 'CMP Hack Squad Participant'}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Award className="w-3 h-3 text-brand-red" />
                Meal Entitlement
              </div>
              <div className="font-bold text-xs text-emerald-400 font-mono">
                1 HACKATHON MEAL
              </div>
            </div>
          </div>

          {/* Footer Credits */}
          <div className="z-10 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-gray-400 gap-2 font-mono">
            <div>
              <span className="text-gray-500">Organized by: </span>
              <strong className="text-white">CMP Hack Squad</strong>
            </div>
            <div>
              <span className="text-gray-500">Partner: </span>
              <strong className="text-white">GDG Prayagraj</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS (PNG, PDF, PRINT, COPY ID) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:hidden">
        <button
          onClick={handleDownloadPng}
          disabled={isGeneratingPng}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-brand-red hover:bg-red-600 text-white font-mono text-xs font-bold rounded-xl transition-all shadow-lg shadow-brand-red/20 disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>{isGeneratingPng ? 'Generating...' : 'DOWNLOAD PNG'}</span>
        </button>

        <button
          onClick={handleDownloadPdf}
          disabled={isGeneratingPdf}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-[#141416] border border-[#22242B] hover:bg-white/10 text-white font-mono text-xs font-bold rounded-xl transition-all disabled:opacity-50"
        >
          <FileText className="w-4 h-4 text-red-400" />
          <span>{isGeneratingPdf ? 'Exporting...' : 'DOWNLOAD PDF'}</span>
        </button>

        <button
          onClick={() => window.print()}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-[#141416] border border-[#22242B] hover:bg-white/10 text-white font-mono text-xs font-bold rounded-xl transition-all"
        >
          <Printer className="w-4 h-4 text-emerald-400" />
          <span>PRINT</span>
        </button>

        <button
          onClick={handleCopyId}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-[#141416] border border-[#22242B] hover:bg-white/10 text-white font-mono text-xs font-bold rounded-xl transition-all"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400">COPIED ✓</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-sky-400" />
              <span>COPY ID</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
