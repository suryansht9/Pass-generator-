'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-[#22242B] bg-[#080808] text-gray-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
          {/* Left Branding Block */}
          <div className="space-y-3 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <img
                src="/cmp-logo.png"
                alt="CMP Hack Squad Logo"
                className="w-10 h-10 object-contain"
              />
              <div>
                <div className="font-display font-black text-white text-base tracking-wider">
                  CODE FOR COMMUNITY HACKATHON
                </div>
                <div className="text-xs font-mono text-brand-red font-bold">
                  CMP × GDG • 18 SEPTEMBER 2026
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-400 max-w-md pt-1">
              Organized by <strong className="text-white">CMP Hack Squad</strong> in collaboration with{' '}
              <strong className="text-white">GDG Prayagraj</strong>. Bringing student developers together to solve real community challenges.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 font-mono text-xs text-gray-300">
            <Link href="/" className="hover:text-brand-red transition-colors">Home</Link>
            <Link href="/register" className="hover:text-brand-red transition-colors">Generate Pass</Link>
            <Link href="/scanner" className="hover:text-brand-red transition-colors">Verify & Scan</Link>
            <Link href="/admin" className="hover:text-brand-red transition-colors">Admin Portal</Link>
          </div>
        </div>

        <div className="pt-6 border-t border-[#22242B]/60 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-gray-500 gap-4">
          <p>© 2026 CMP Hack Squad. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span>CMP Hack Squad × GDG Prayagraj</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
