'use client';

import React, { useState } from 'react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { Download, FileText, Printer, Share2, Copy, Check, Sparkles } from 'lucide-react';
import { getAppBaseUrl } from '@/lib/utils';

interface PassExportActionsProps {
  participantId: string;
  fullName: string;
  passElementId?: string;
}

export default function PassExportActions({
  participantId,
  fullName,
  passElementId = 'hackathon-digital-pass',
}: PassExportActionsProps) {
  const [isGeneratingPng, setIsGeneratingPng] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const verificationUrl = `${getAppBaseUrl()}/verify/${participantId}`;

  // High Resolution PNG Download (Minimum 1600x700px rendering)
  const handleDownloadPng = async () => {
    try {
      setIsGeneratingPng(true);
      const element = document.getElementById(passElementId);
      if (!element) {
        alert('Pass element not found.');
        return;
      }

      const dataUrl = await toPng(element, {
        quality: 1.0,
        pixelRatio: 3, // 3x multiplier guarantees high res (>1600px wide)
        cacheBust: true,
      });

      const link = document.createElement('a');
      link.download = `${participantId}_Pass_${fullName.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate PNG:', err);
      alert('Failed to generate PNG pass. Please try printing instead.');
    } finally {
      setIsGeneratingPng(false);
    }
  };

  // PDF Export
  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      const element = document.getElementById(passElementId);
      if (!element) return;

      const dataUrl = await toPng(element, {
        quality: 0.98,
        pixelRatio: 2.5,
      });

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [850, 420],
      });

      pdf.addImage(dataUrl, 'PNG', 0, 0, 850, 420);
      pdf.save(`${participantId}_Pass_${fullName.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Failed to generate PDF pass.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Print
  const handlePrint = () => {
    window.print();
  };

  // Share via Web Share API or Copy Link
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Code for Community Hackathon Pass - ${fullName}`,
          text: `Here is my official entry pass for Code for Community Hackathon (CMP × GDG)! ID: ${participantId}`,
          url: verificationUrl,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      } catch (err) {
        // User cancelled share or failed
      }
    } else {
      await handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(verificationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  return (
    <div className="w-full max-w-[850px] mx-auto space-y-4">
      {/* Primary Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:hidden">
        <button
          onClick={handleDownloadPng}
          disabled={isGeneratingPng}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-brand-red to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-xl text-sm transition-all transform hover:-translate-y-0.5 shadow-lg shadow-brand-red-glow disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>{isGeneratingPng ? 'Generating...' : 'DOWNLOAD PNG'}</span>
        </button>

        <button
          onClick={handleDownloadPdf}
          disabled={isGeneratingPdf}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-brand-card border border-brand-border hover:bg-white/10 text-white font-bold rounded-xl text-sm transition-all transform hover:-translate-y-0.5 shadow-md disabled:opacity-50"
        >
          <FileText className="w-4 h-4 text-red-400" />
          <span>{isGeneratingPdf ? 'Exporting...' : 'DOWNLOAD PDF'}</span>
        </button>

        <button
          onClick={handlePrint}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-brand-card border border-brand-border hover:bg-white/10 text-white font-bold rounded-xl text-sm transition-all transform hover:-translate-y-0.5 shadow-md"
        >
          <Printer className="w-4 h-4 text-emerald-400" />
          <span>PRINT</span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-brand-card border border-brand-border hover:bg-white/10 text-white font-bold rounded-xl text-sm transition-all transform hover:-translate-y-0.5 shadow-md"
        >
          <Share2 className="w-4 h-4 text-sky-400" />
          <span>{shareSuccess ? 'SHARED!' : 'SHARE'}</span>
        </button>
      </div>

      {/* Copy Verification Link Bar */}
      <div className="bg-brand-card/90 border border-brand-border/80 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs print:hidden">
        <div className="flex items-center gap-2 text-gray-300 w-full sm:w-auto truncate">
          <Sparkles className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="text-gray-400 font-mono flex-shrink-0">Verification Link:</span>
          <span className="font-mono text-gray-200 truncate">{verificationUrl}</span>
        </div>

        <button
          onClick={handleCopyLink}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-semibold transition-colors flex-shrink-0"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">COPIED ✓</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-gray-300" />
              <span>COPY LINK</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
