'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Ticket, QrCode, ShieldCheck, Menu, X, Utensils } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/register', label: 'Generate Pass' },
    { href: '/food', label: 'Check-in for Food' },
    { href: '/scanner', label: 'Verify & Scan' },
    { href: '/admin/actions', label: 'View All Actions' },
    { href: '/admin', label: 'Admin Portal' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#080808]/90 backdrop-blur-md border-b border-[#22242B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Event Title Anchor */}
          <Link href="/" className="flex items-center gap-3.5 group">
            {/* Official CMP Hack Squad Logo */}
            <div className="relative w-11 h-11 flex-shrink-0 transition-transform group-hover:scale-105">
              <img
                src="/cmp-logo.png"
                alt="CMP Hack Squad Official Logo"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex flex-col">
              <div className="font-display font-black text-sm text-white tracking-wider uppercase leading-none group-hover:text-red-500 transition-colors">
                CODE FOR COMMUNITY
              </div>
              <div className="text-[10px] font-mono text-gray-400 tracking-widest uppercase mt-1 flex items-center gap-1.5">
                <span className="text-brand-red font-bold">CMP HACK SQUAD</span>
                <span className="text-gray-600">×</span>
                <span>GDG • 18 SEP</span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 font-mono text-xs">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-2 rounded-lg font-semibold tracking-wider transition-all ${
                    isActive
                      ? 'bg-brand-red text-white shadow-md shadow-brand-red/20'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Nav */}
      {isOpen && (
        <div className="md:hidden border-b border-[#22242B] bg-[#111111] px-4 pt-3 pb-6 space-y-2 font-mono text-sm">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-3 rounded-xl font-semibold transition-colors ${
                  isActive
                    ? 'bg-brand-red text-white'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
