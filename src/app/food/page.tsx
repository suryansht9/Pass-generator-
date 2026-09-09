'use client';

import React, { useState } from 'react';
import FoodPassCard, { FoodPassData } from '@/components/FoodPassCard';
import { Utensils, Mail, User, ShieldX, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function FoodCheckInPage() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUnregistered, setIsUnregistered] = useState(false);
  const [foodPassData, setFoodPassData] = useState<FoodPassData | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsUnregistered(false);

    if (!email.trim()) {
      setErrorMsg('Please enter your registered Email Address.');
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await fetch('/api/food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          fullName: fullName.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.isUnregistered) {
          setIsUnregistered(true);
        }
        throw new Error(data.error || 'Food Check-in failed.');
      }

      setFoodPassData(data.foodPass);
    } catch (err: any) {
      console.error('Food check-in error:', err);
      setErrorMsg(err.message || 'Failed to process Food Check-in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-red/10 border border-brand-red/30 text-xs font-mono text-brand-red font-bold">
          <Utensils className="w-3.5 h-3.5" />
          <span>HACKATHON MEAL CHECK-IN</span>
        </div>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
          Check-in for Food
        </h1>
        <p className="text-sm text-brand-muted max-w-lg mx-auto">
          Enter your registered email address to verify your eligibility and generate your official Food Pass.
        </p>
      </div>

      {/* UNREGISTERED EMAIL ERROR BANNER */}
      {isUnregistered && (
        <div className="p-5 rounded-2xl bg-rose-950/90 border-2 border-rose-500 text-white space-y-2 shadow-2xl animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-rose-400 font-display font-bold text-lg">
            <ShieldX className="w-6 h-6 flex-shrink-0" />
            <span>Check-in Denied</span>
          </div>
          <p className="text-sm text-rose-100 font-medium">
            Your email is not registered for this event.
          </p>
          <div className="text-xs font-mono text-rose-300/80 pt-1">
            CMP Hack Squad × GDG Prayagraj • Official Food Counter System
          </div>
        </div>
      )}

      {/* Generic Error Alert */}
      {errorMsg && !isUnregistered && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>{errorMsg}</div>
        </div>
      )}

      {/* FOOD CHECK-IN FORM */}
      {!foodPassData ? (
        <div className="bg-[#141416] border border-[#22242B] rounded-2xl p-6 sm:p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* REGISTERED EMAIL ADDRESS */}
            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold text-gray-200 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-brand-red">
                  <Mail className="w-4 h-4 text-brand-red" />
                  Registered Email Address <span className="text-brand-red">*</span>
                </span>
                <span className="text-[10px] text-brand-red font-bold">Primary Verification Criterion</span>
              </label>
              <input
                type="email"
                required
                placeholder="e.g. rahul.sharma@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setIsUnregistered(false);
                }}
                className="w-full px-4 py-3 bg-[#080808] border border-[#22242B] rounded-xl text-sm font-mono text-white placeholder-gray-500 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition-all"
              />
            </div>

            {/* FULL NAME */}
            <div className="space-y-2">
              <label className="block text-xs font-mono font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-brand-red" />
                Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-[#080808] border border-[#22242B] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-brand-red hover:bg-red-600 text-white font-mono font-bold text-sm tracking-wider rounded-xl transition-all shadow-lg shadow-brand-red/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verifying Meal Eligibility...</span>
                </>
              ) : (
                <>
                  <Utensils className="w-5 h-5" />
                  <span>GENERATE FOOD PASS</span>
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        /* GENERATED FOOD PASS DISPLAY (NO QR CODE) */
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>FOOD PASS GENERATED & VERIFIED</span>
            </div>
            <button
              onClick={() => setFoodPassData(null)}
              className="text-[11px] underline hover:text-white"
            >
              Check another email
            </button>
          </div>

          <FoodPassCard data={foodPassData} />
        </div>
      )}
    </div>
  );
}
