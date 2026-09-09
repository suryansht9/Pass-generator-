'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Building,
  Award,
  Search,
  RefreshCw,
  LogOut,
  ShieldCheck,
  FileSpreadsheet,
  Utensils,
  Loader2,
  XCircle,
  Clock,
  ArrowLeft,
  Activity,
} from 'lucide-react';

interface ActionParticipant {
  id: string;
  participantId: string;
  fullName: string;
  email: string;
  collegeName: string;
  teamName: string;
  status: string;
  claimedAt?: string | null;
  checkedIn: boolean;
  checkedInAt?: string | null;
  foodPassGenerated: boolean;
  foodPassGeneratedAt?: string | null;
  foodPassId?: string | null;
  foodReceived: boolean;
  foodReceivedAt?: string | null;
  createdAt?: string | null;
}

interface ActionStats {
  totalRegistered: number;
  mainPassGenerated: number;
  entryCheckedIn: number;
  foodPassGenerated: number;
  foodReceived: number;
}

export default function AdminActionsPage() {
  const router = useRouter();

  const [participants, setParticipants] = useState<ActionParticipant[]>([]);
  const [stats, setStats] = useState<ActionStats>({
    totalRegistered: 0,
    mainPassGenerated: 0,
    entryCheckedIn: 0,
    foodPassGenerated: 0,
    foodReceived: 0,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch Action Data directly from backend database
  const fetchActionsData = async (query = '') => {
    try {
      setIsRefreshing(true);
      const res = await fetch(`/api/admin/actions?q=${encodeURIComponent(query)}`);

      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }

      const data = await res.json();
      if (data.success) {
        setParticipants(data.participants);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Fetch actions error:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActionsData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchActionsData(searchQuery);
  };

  const handleExportExcel = () => {
    setIsExporting(true);
    window.location.href = '/api/admin/export-excel';
    setTimeout(() => setIsExporting(false), 2500);
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return null;
    return new Date(isoString).toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-brand-border/60 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="p-1.5 bg-brand-card hover:bg-white/10 text-gray-300 rounded-lg border border-brand-border text-xs transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-red/10 border border-brand-red/30 text-xs font-mono text-red-400 font-bold">
              <Activity className="w-3.5 h-3.5" />
              <span>ADMIN ACTION AUDIT LOG</span>
            </div>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
            Participant Action Audit View
          </h1>
          <p className="text-xs text-brand-muted font-mono">
            Real-time status tracking & action log sourced live from backend database.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* REFRESH DATA BUTTON */}
          <button
            onClick={() => fetchActionsData(searchQuery)}
            disabled={isRefreshing}
            className="p-2.5 bg-brand-card hover:bg-white/10 text-white rounded-xl border border-brand-border text-xs font-mono font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-red-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'REFRESH DATA'}</span>
          </button>

          {/* EXCEL EXPORT BUTTON */}
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isExporting ? 'Exporting...' : 'VIEW DATA IN EXCEL'}</span>
          </button>
        </div>
      </div>

      {/* STATS ANALYTICS COUNTERS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-brand-card p-5 rounded-2xl border border-brand-border/80 space-y-1 shadow-lg">
          <div className="text-[11px] font-mono text-gray-400 uppercase tracking-wider flex items-center justify-between">
            <span>REGISTERED</span>
            <Users className="w-4 h-4 text-red-400" />
          </div>
          <div className="font-display font-black text-2xl sm:text-3xl text-white">
            {stats.totalRegistered}
          </div>
          <p className="text-[10px] text-gray-500 font-mono">Whitelisted Emails</p>
        </div>

        <div className="bg-brand-card p-5 rounded-2xl border border-brand-border/80 space-y-1 shadow-lg">
          <div className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider flex items-center justify-between">
            <span>MAIN PASSES</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-display font-black text-2xl sm:text-3xl text-emerald-400">
            {stats.mainPassGenerated}
          </div>
          <p className="text-[10px] text-gray-500 font-mono">Generated Entry Passes</p>
        </div>

        <div className="bg-brand-card p-5 rounded-2xl border border-brand-border/80 space-y-1 shadow-lg">
          <div className="text-[11px] font-mono text-sky-400 uppercase tracking-wider flex items-center justify-between">
            <span>CHECKED IN</span>
            <ShieldCheck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="font-display font-black text-2xl sm:text-3xl text-sky-400">
            {stats.entryCheckedIn}
          </div>
          <p className="text-[10px] text-gray-500 font-mono">Event Entrance Scanned</p>
        </div>

        <div className="bg-brand-card p-5 rounded-2xl border border-brand-border/80 space-y-1 shadow-lg">
          <div className="text-[11px] font-mono text-amber-400 uppercase tracking-wider flex items-center justify-between">
            <span>FOOD PASSES</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-display font-black text-2xl sm:text-3xl text-amber-400">
            {stats.foodPassGenerated}
          </div>
          <p className="text-[10px] text-gray-500 font-mono">Food Passes Claimed</p>
        </div>

        <div className="bg-brand-card p-5 rounded-2xl border border-brand-border/80 space-y-1 shadow-lg col-span-2 lg:col-span-1">
          <div className="text-[11px] font-mono text-emerald-300 uppercase tracking-wider flex items-center justify-between">
            <span>FOOD RECEIVED</span>
            <Utensils className="w-4 h-4 text-emerald-300" />
          </div>
          <div className="font-display font-black text-2xl sm:text-3xl text-emerald-300">
            {stats.foodReceived}
          </div>
          <p className="text-[10px] text-gray-500 font-mono">Meals Distributed</p>
        </div>
      </div>

      {/* SEARCH BAR & TABLE */}
      <div className="space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-lg">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by participant ID, name, email, team..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-brand-card border border-brand-border rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-red font-mono"
            />
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-brand-red hover:bg-red-600 text-white font-mono text-xs font-bold rounded-xl transition-colors"
          >
            Search
          </button>
        </form>

        <div className="bg-brand-card border border-brand-border rounded-2xl overflow-x-auto shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-dark border-b border-brand-border text-[11px] font-mono text-gray-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">PARTICIPANT ID</th>
                <th className="py-3.5 px-4">PARTICIPANT INFO</th>
                <th className="py-3.5 px-4">COLLEGE & TEAM</th>
                <th className="py-3.5 px-4 text-center">1. MAIN PASS</th>
                <th className="py-3.5 px-4 text-center">2. CHECK-IN</th>
                <th className="py-3.5 px-4 text-center">3. FOOD PASS</th>
                <th className="py-3.5 px-4 text-center">4. FOOD RECEIVED</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 font-mono">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-red" />
                    Loading action audit log...
                  </td>
                </tr>
              ) : participants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 font-mono">
                    No participant action records found.
                  </td>
                </tr>
              ) : (
                participants.map((p) => {
                  const isMainPassGen = p.status === 'CLAIMED' || (p.participantId && p.participantId !== '—');

                  return (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                      {/* Participant ID */}
                      <td className="py-3 px-4 font-mono font-bold text-red-400">
                        {p.participantId}
                      </td>

                      {/* Name & Email */}
                      <td className="py-3 px-4 space-y-0.5">
                        <div className="font-bold text-white">{p.fullName}</div>
                        <div className="font-mono text-[11px] text-gray-400">{p.email}</div>
                      </td>

                      {/* College & Team */}
                      <td className="py-3 px-4 space-y-0.5">
                        <div className="text-gray-300 font-semibold">{p.collegeName}</div>
                        <div className="text-xs font-mono text-gray-400">{p.teamName}</div>
                      </td>

                      {/* 1. Main Pass Generated */}
                      <td className="py-3 px-4 text-center">
                        {isMainPassGen ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono text-[10px] font-bold">
                              ☑ Pass Generated
                            </span>
                            {formatDate(p.claimedAt) && (
                              <span className="text-[9px] font-mono text-gray-500 mt-1 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                {formatDate(p.claimedAt)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10 font-mono text-[10px]">
                            ☐ Pending
                          </span>
                        )}
                      </td>

                      {/* 2. Entry Check-in */}
                      <td className="py-3 px-4 text-center">
                        {p.checkedIn ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 font-mono text-[10px] font-bold">
                              ☑ Checked In
                            </span>
                            {formatDate(p.checkedInAt) && (
                              <span className="text-[9px] font-mono text-gray-500 mt-1 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                {formatDate(p.checkedInAt)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10 font-mono text-[10px]">
                            ☐ Not Checked In
                          </span>
                        )}
                      </td>

                      {/* 3. Food Pass Generated */}
                      <td className="py-3 px-4 text-center">
                        {p.foodPassGenerated ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono text-[10px] font-bold">
                              ☑ {p.foodPassId || 'Food Pass'}
                            </span>
                            {formatDate(p.foodPassGeneratedAt) && (
                              <span className="text-[9px] font-mono text-gray-500 mt-1 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                {formatDate(p.foodPassGeneratedAt)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10 font-mono text-[10px]">
                            ☐ No Pass
                          </span>
                        )}
                      </td>

                      {/* 4. Food Received */}
                      <td className="py-3 px-4 text-center">
                        {p.foodReceived ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-[10px] font-bold">
                              ☑ Food Received
                            </span>
                            {formatDate(p.foodReceivedAt) && (
                              <span className="text-[9px] font-mono text-gray-500 mt-1 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                {formatDate(p.foodReceivedAt)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10 font-mono text-[10px]">
                            ☐ Not Received
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
