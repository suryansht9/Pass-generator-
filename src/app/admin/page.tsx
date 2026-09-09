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
  Key,
  Eye,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Plus,
  Trash2,
  FileSpreadsheet,
  Upload,
  UserPlus,
  Mail,
  Loader2,
} from 'lucide-react';
import { getAppBaseUrl } from '@/lib/utils';

interface Participant {
  id: string;
  participantId: string;
  fullName: string;
  collegeName: string;
  teamName: string;
  photoUrl: string;
  verificationToken: string;
  status: 'ACTIVE' | 'REVOKED' | string;
  createdAt: string;
}

interface WhitelistItem {
  id: string;
  fullName: string;
  collegeName: string;
  teamName: string;
  email?: string | null;
  accessCode?: string | null;
  status: 'PENDING' | 'CLAIMED' | 'REVOKED' | string;
  claimedAt?: string | null;
  participantId?: string | null;
  createdAt: string;
}

interface AccessCodeItem {
  id: string;
  code: string;
  status: string;
  usedBy?: string | null;
  createdAt: string;
  usedAt?: string | null;
}

interface Stats {
  totalParticipants: number;
  activePasses: number;
  revokedPasses: number;
  totalTeams: number;
  totalColleges: number;
}

interface WhitelistStats {
  totalCapacity: number;
  totalPreRegistered: number;
  claimedPasses: number;
  pendingPasses: number;
  remainingSlots: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'whitelist' | 'participants' | 'access-codes'>('whitelist');

  // Stats
  const [stats, setStats] = useState<Stats>({
    totalParticipants: 0,
    activePasses: 0,
    revokedPasses: 0,
    totalTeams: 0,
    totalColleges: 0,
  });

  const [whitelistStats, setWhitelistStats] = useState<WhitelistStats>({
    totalCapacity: 200,
    totalPreRegistered: 0,
    claimedPasses: 0,
    pendingPasses: 0,
    remainingSlots: 200,
  });

  // Data Arrays
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [whitelist, setWhitelist] = useState<WhitelistItem[]>([]);
  const [accessCodes, setAccessCodes] = useState<AccessCodeItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Single Add Pre-Registration Form State
  const [singleEmail, setSingleEmail] = useState('');
  const [singleName, setSingleName] = useState('');
  const [singleCollege, setSingleCollege] = useState('');
  const [singleTeam, setSingleTeam] = useState('');
  const [singleCode, setSingleCode] = useState('');

  // Bulk CSV Text State
  const [csvText, setCsvText] = useState('');
  const [isImportingCsv, setIsImportingCsv] = useState(false);

  // Access Code Creation State
  const [newCustomCode, setNewCustomCode] = useState('');
  const [isGeneratingCodes, setIsGeneratingCodes] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch Participants
  const fetchParticipants = async (query = '') => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/participants?q=${encodeURIComponent(query)}`);
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
      console.error('Failed to fetch participants:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Whitelist
  const fetchWhitelist = async (query = '') => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/whitelist?q=${encodeURIComponent(query)}`);
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      if (data.success) {
        setWhitelist(data.whitelist);
        setWhitelistStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch whitelist:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Access Codes
  const fetchAccessCodes = async () => {
    try {
      const res = await fetch('/api/admin/access-codes');
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      if (data.success) {
        setAccessCodes(data.codes);
      }
    } catch (err) {
      console.error('Failed to fetch access codes:', err);
    }
  };

  useEffect(() => {
    fetchWhitelist();
    fetchParticipants();
    fetchAccessCodes();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'whitelist') {
      fetchWhitelist(searchQuery);
    } else {
      fetchParticipants(searchQuery);
    }
  };

  // Single Add Whitelist Participant (Email Primary)
  const handleAddSingleWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleEmail.trim()) {
      alert('Email address is required for pre-registration whitelist.');
      return;
    }

    try {
      const res = await fetch('/api/admin/whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: singleEmail.trim().toLowerCase(),
          fullName: singleName.trim() || 'Selected Participant',
          collegeName: singleCollege.trim() || 'CMP College',
          teamName: singleTeam.trim() || 'Independent Team',
          accessCode: singleCode.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to add participant.');
      } else {
        setSingleEmail('');
        setSingleName('');
        setSingleCollege('');
        setSingleTeam('');
        setSingleCode('');
        fetchWhitelist();
      }
    } catch (err) {
      console.error('Add single error:', err);
    }
  };

  // Bulk Import CSV (Format: Email, Full Name, College, Team, Access Code)
  const handleBulkCsvImport = async () => {
    if (!csvText.trim()) return;

    try {
      setIsImportingCsv(true);
      const lines = csvText.split('\n');
      const parsedItems = [];

      for (const line of lines) {
        const parts = line.split(',').map((p) => p.trim());
        if (parts.length >= 1 && parts[0]) {
          // If first column contains '@', treat as email
          const isEmailFirst = parts[0].includes('@');
          const email = isEmailFirst ? parts[0] : parts[3] || parts[0];
          const fullName = isEmailFirst ? parts[1] || 'Selected Participant' : parts[0];
          const collegeName = isEmailFirst ? parts[2] || 'CMP College' : parts[1] || 'CMP College';
          const teamName = isEmailFirst ? parts[3] || 'Team Hack' : parts[2] || 'Team Hack';
          const accessCode = parts[4] || undefined;

          parsedItems.push({
            email: email ? email.toLowerCase() : undefined,
            fullName,
            collegeName,
            teamName,
            accessCode,
          });
        }
      }

      const res = await fetch('/api/admin/whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participants: parsedItems }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'CSV import failed');
      } else {
        alert(data.message);
        setCsvText('');
        fetchWhitelist();
      }
    } catch (err) {
      console.error('CSV import error:', err);
    } finally {
      setIsImportingCsv(false);
    }
  };

  // Delete Whitelist Entry
  const handleDeleteWhitelist = async (id: string) => {
    if (!confirm('Are you sure you want to remove this email address from the whitelist?')) return;
    try {
      const res = await fetch(`/api/admin/whitelist/${id}`, { method: 'DELETE' });
      if (res.ok) fetchWhitelist(searchQuery);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Reset Whitelist Status to PENDING
  const handleResetWhitelistStatus = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/whitelist/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PENDING' }),
      });
      if (res.ok) fetchWhitelist(searchQuery);
    } catch (err) {
      console.error('Reset status error:', err);
    }
  };

  // Toggle Participant Status (ACTIVE <-> REVOKED)
  const handleToggleStatus = async (participantId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'REVOKED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/admin/participants/${participantId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        fetchParticipants(searchQuery);
      } else {
        alert('Failed to update status.');
      }
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  // Create Access Code
  const handleCreateAccessCode = async (customCode?: string, count = 1) => {
    try {
      setIsGeneratingCodes(true);
      const res = await fetch('/api/admin/access-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: customCode, count }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to create access code.');
      } else {
        setNewCustomCode('');
        fetchAccessCodes();
      }
    } catch (err) {
      console.error('Create code error:', err);
    } finally {
      setIsGeneratingCodes(false);
    }
  };

  // Revoke Access Code
  const handleToggleCodeStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'REVOKED' : 'ACTIVE';
    try {
      const res = await fetch('/api/admin/access-codes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      if (res.ok) {
        fetchAccessCodes();
      }
    } catch (err) {
      console.error('Toggle code status error:', err);
    }
  };

  // Admin Logout
  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const copyUrl = async (participantId: string) => {
    const url = `${getAppBaseUrl()}/verify/${participantId}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(participantId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-brand-border/60 pb-6">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
            Organizer Admin Portal
          </h1>
          <p className="text-xs text-brand-muted">
            Code for Community Hackathon • CMP Hack Squad × GDG Prayagraj
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchWhitelist(searchQuery);
              fetchParticipants(searchQuery);
              fetchAccessCodes();
            }}
            className="p-2.5 bg-brand-card hover:bg-white/10 text-gray-300 rounded-xl border border-brand-border text-xs font-mono flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-red-400" />
            <span>Refresh Data</span>
          </button>

          <button
            onClick={handleLogout}
            className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-xl border border-rose-500/30 text-xs font-mono flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-brand-card p-5 rounded-2xl border border-brand-border/80 space-y-1 shadow-lg">
          <div className="text-[11px] font-mono text-gray-400 uppercase tracking-wider flex items-center justify-between">
            <span>200 MAX CAPACITY</span>
            <Users className="w-4 h-4 text-red-400" />
          </div>
          <div className="font-display font-black text-2xl sm:text-3xl text-white">
            {whitelistStats.totalPreRegistered} / 200
          </div>
          <p className="text-[10px] text-gray-500 font-mono">Whitelisted Emails</p>
        </div>

        <div className="bg-brand-card p-5 rounded-2xl border border-brand-border/80 space-y-1 shadow-lg">
          <div className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider flex items-center justify-between">
            <span>PASSES CLAIMED</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-display font-black text-2xl sm:text-3xl text-emerald-400">
            {whitelistStats.claimedPasses}
          </div>
          <p className="text-[10px] text-gray-500 font-mono">Generated Entry Passes</p>
        </div>

        <div className="bg-brand-card p-5 rounded-2xl border border-brand-border/80 space-y-1 shadow-lg">
          <div className="text-[11px] font-mono text-amber-400 uppercase tracking-wider flex items-center justify-between">
            <span>PENDING SLOTS</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-display font-black text-2xl sm:text-3xl text-amber-400">
            {whitelistStats.pendingPasses}
          </div>
          <p className="text-[10px] text-gray-500 font-mono">Awaiting Pass Claim</p>
        </div>

        <div className="bg-brand-card p-5 rounded-2xl border border-brand-border/80 space-y-1 shadow-lg">
          <div className="text-[11px] font-mono text-rose-400 uppercase tracking-wider flex items-center justify-between">
            <span>REVOKED PASSES</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="font-display font-black text-2xl sm:text-3xl text-rose-400">
            {stats.revokedPasses}
          </div>
          <p className="text-[10px] text-gray-500 font-mono">Denied Gate Entry</p>
        </div>

        <div className="bg-brand-card p-5 rounded-2xl border border-brand-border/80 space-y-1 shadow-lg col-span-2 lg:col-span-1">
          <div className="text-[11px] font-mono text-sky-400 uppercase tracking-wider flex items-center justify-between">
            <span>COLLEGES</span>
            <Building className="w-4 h-4 text-sky-400" />
          </div>
          <div className="font-display font-black text-2xl sm:text-3xl text-white">
            {stats.totalColleges}
          </div>
          <p className="text-[10px] text-gray-500 font-mono">Institutions Represented</p>
        </div>
      </div>

      {/* TABS HEADER */}
      <div className="flex items-center gap-2 border-b border-brand-border overflow-x-auto">
        <button
          onClick={() => setActiveTab('whitelist')}
          className={`px-5 py-3 text-xs font-mono font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'whitelist'
              ? 'border-brand-red text-red-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Email Whitelist (200 Max) ({whitelist.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('participants')}
          className={`px-5 py-3 text-xs font-mono font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'participants'
              ? 'border-brand-red text-red-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Generated Passes ({participants.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('access-codes')}
          className={`px-5 py-3 text-xs font-mono font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'access-codes'
              ? 'border-brand-red text-red-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Access Codes ({accessCodes.length})</span>
        </button>
      </div>

      {/* TAB 1: PRE-REGISTERED EMAIL WHITELIST */}
      {activeTab === 'whitelist' && (
        <div className="space-y-6">
          {/* INPUT TOOLS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Single Add Form (Email Primary) */}
            <div className="bg-brand-card border border-brand-border rounded-2xl p-5 space-y-4 shadow-lg">
              <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-red-400" />
                Pre-Register Participant Email
              </h3>

              <form onSubmit={handleAddSingleWhitelist} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-red-400 font-bold">
                    Email Address (Primary Unique Key) *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rahul.sharma@example.com"
                    value={singleEmail}
                    onChange={(e) => setSingleEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-brand-dark border border-brand-border rounded-xl text-white font-mono placeholder-gray-500 focus:outline-none focus:border-brand-red"
                  />
                </div>

                <input
                  type="text"
                  placeholder="Full Name"
                  value={singleName}
                  onChange={(e) => setSingleName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-brand-dark border border-brand-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-red"
                />

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="College Name"
                    value={singleCollege}
                    onChange={(e) => setSingleCollege(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-brand-dark border border-brand-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-red"
                  />
                  <input
                    type="text"
                    placeholder="Team Name"
                    value={singleTeam}
                    onChange={(e) => setSingleTeam(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-brand-dark border border-brand-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-red"
                  />
                </div>

                <input
                  type="text"
                  placeholder="Access Code (Optional)"
                  value={singleCode}
                  onChange={(e) => setSingleCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 bg-brand-dark border border-brand-border rounded-xl text-white font-mono placeholder-gray-500 focus:outline-none focus:border-brand-red"
                />

                <button
                  type="submit"
                  className="w-full py-2.5 bg-brand-red hover:bg-red-600 text-white font-mono font-bold rounded-xl transition-colors"
                >
                  ADD EMAIL TO WHITELIST
                </button>
              </form>
            </div>

            {/* Bulk CSV Uploader */}
            <div className="bg-brand-card border border-brand-border rounded-2xl p-5 space-y-3 shadow-lg">
              <h3 className="font-display font-bold text-sm text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  Bulk Import 200 Emails (CSV)
                </span>
                <span className="text-[10px] font-mono text-gray-400">Email First Format</span>
              </h3>

              <textarea
                rows={4}
                placeholder="Paste CSV lines in format:
Email, Full Name, College Name, Team Name, Access Code

Example:
rahul.sharma@example.com, Rahul Sharma, CMP College, Code Warriors
priya.patel@example.com, Priya Patel, AU, Tech Titans"
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="w-full p-3 bg-brand-dark border border-brand-border rounded-xl text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-brand-red resize-none"
              />

              <button
                onClick={handleBulkCsvImport}
                disabled={isImportingCsv || !csvText.trim()}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>{isImportingCsv ? 'Importing Emails...' : 'IMPORT BULK CSV'}</span>
              </button>
            </div>
          </div>

          {/* Search Bar & Table */}
          <div className="space-y-4">
            <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-lg">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search whitelist by email, name, college, team..."
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

            <div className="bg-brand-card border border-brand-border rounded-2xl overflow-x-auto shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-brand-dark border-b border-brand-border text-[11px] font-mono text-gray-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">EMAIL ADDRESS</th>
                    <th className="py-3.5 px-4">FULL NAME</th>
                    <th className="py-3.5 px-4">COLLEGE</th>
                    <th className="py-3.5 px-4">TEAM</th>
                    <th className="py-3.5 px-4">STATUS</th>
                    <th className="py-3.5 px-4">PASS ID</th>
                    <th className="py-3.5 px-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/60 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400 font-mono">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-red" />
                        Loading email whitelist records...
                      </td>
                    </tr>
                  ) : whitelist.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400 font-mono">
                        No pre-registered emails in whitelist.
                      </td>
                    </tr>
                  ) : (
                    whitelist.map((w) => (
                      <tr key={w.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-red-400">
                          {w.email || '—'}
                        </td>
                        <td className="py-3 px-4 font-bold text-white">{w.fullName}</td>
                        <td className="py-3 px-4 text-gray-300">{w.collegeName}</td>
                        <td className="py-3 px-4 text-gray-300">{w.teamName}</td>
                        <td className="py-3 px-4">
                          {w.status === 'CLAIMED' ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono text-[10px] font-bold">
                              PASS CLAIMED
                            </span>
                          ) : w.status === 'PENDING' ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono text-[10px] font-bold">
                              PENDING
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-mono text-[10px] font-bold">
                              REVOKED
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-gray-300">
                          {w.participantId ? (
                            <Link
                              href={`/pass/${w.participantId}`}
                              target="_blank"
                              className="text-red-400 hover:underline"
                            >
                              {w.participantId}
                            </Link>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          {w.status === 'CLAIMED' && (
                            <button
                              onClick={() => handleResetWhitelistStatus(w.id)}
                              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 border border-amber-500/30 rounded-lg text-[10px] font-mono font-bold transition-colors"
                            >
                              RESET TO PENDING
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteWhitelist(w.id)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/30 text-rose-400 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GENERATED PASSES */}
      {activeTab === 'participants' && (
        <div className="space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-lg">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search generated passes..."
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

          <div className="bg-brand-card border border-brand-border rounded-2xl overflow-x-auto shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-dark border-b border-brand-border text-[11px] font-mono text-gray-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">PHOTO</th>
                  <th className="py-3.5 px-4">NAME</th>
                  <th className="py-3.5 px-4">COLLEGE</th>
                  <th className="py-3.5 px-4">TEAM</th>
                  <th className="py-3.5 px-4">PARTICIPANT ID</th>
                  <th className="py-3.5 px-4">STATUS</th>
                  <th className="py-3.5 px-4">CREATED</th>
                  <th className="py-3.5 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/60 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400 font-mono">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-red" />
                      Loading generated pass records...
                    </td>
                  </tr>
                ) : participants.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400 font-mono">
                      No generated passes found.
                    </td>
                  </tr>
                ) : (
                  participants.map((p) => (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4">
                        <img
                          src={p.photoUrl}
                          alt={p.fullName}
                          className="w-10 h-10 rounded-lg object-cover border border-white/10"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://ui-avatars.com/api/?name=' +
                              encodeURIComponent(p.fullName) +
                              '&background=111318&color=fff&size=100';
                          }}
                        />
                      </td>
                      <td className="py-3 px-4 font-bold text-white">{p.fullName}</td>
                      <td className="py-3 px-4 text-gray-300">{p.collegeName}</td>
                      <td className="py-3 px-4 text-gray-300">{p.teamName}</td>
                      <td className="py-3 px-4 font-mono font-bold text-red-400">
                        {p.participantId}
                      </td>
                      <td className="py-3 px-4">
                        {p.status === 'ACTIVE' ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono text-[10px] font-bold">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-mono text-[10px] font-bold">
                            REVOKED
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Link
                          href={`/pass/${p.participantId}`}
                          target="_blank"
                          className="inline-flex p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href={`/verify/${p.participantId}`}
                          target="_blank"
                          className="inline-flex p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-emerald-400 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => copyUrl(p.participantId)}
                          className="inline-flex p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-sky-400 transition-colors"
                        >
                          {copiedId === p.participantId ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleToggleStatus(p.participantId, p.status)}
                          className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-colors ${
                            p.status === 'ACTIVE'
                              ? 'bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 border border-rose-500/30'
                              : 'bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {p.status === 'ACTIVE' ? 'REVOKE' : 'RESTORE'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ACCESS CODES */}
      {activeTab === 'access-codes' && (
        <div className="space-y-6">
          <div className="bg-brand-card border border-brand-border rounded-2xl p-4 sm:p-6 space-y-4 shadow-lg">
            <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-red-400" />
              Generate Access Codes
            </h3>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Custom Code (e.g. CMP-GDG-2026) or leave blank for auto"
                value={newCustomCode}
                onChange={(e) => setNewCustomCode(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-2.5 bg-brand-dark border border-brand-border rounded-xl text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-brand-red"
              />

              <button
                onClick={() => handleCreateAccessCode(newCustomCode || undefined, 1)}
                disabled={isGeneratingCodes}
                className="px-5 py-2.5 bg-brand-red hover:bg-red-600 text-white font-mono text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Create Single Code</span>
              </button>

              <button
                onClick={() => handleCreateAccessCode(undefined, 5)}
                disabled={isGeneratingCodes}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Generate 5 Random Codes</span>
              </button>
            </div>
          </div>

          <div className="bg-brand-card border border-brand-border rounded-2xl overflow-x-auto shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-dark border-b border-brand-border text-[11px] font-mono text-gray-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">ACCESS CODE</th>
                  <th className="py-3.5 px-4">STATUS</th>
                  <th className="py-3.5 px-4">USED BY</th>
                  <th className="py-3.5 px-4">CREATED AT</th>
                  <th className="py-3.5 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/60 text-xs">
                {accessCodes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400 font-mono">
                      No access codes generated yet.
                    </td>
                  </tr>
                ) : (
                  accessCodes.map((code) => (
                    <tr key={code.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-white">{code.code}</td>
                      <td className="py-3 px-4">
                        {code.status === 'ACTIVE' && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono text-[10px] font-bold">
                            ACTIVE
                          </span>
                        )}
                        {code.status === 'USED' && (
                          <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 font-mono text-[10px] font-bold">
                            USED
                          </span>
                        )}
                        {code.status === 'REVOKED' && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-mono text-[10px] font-bold">
                            REVOKED
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-300 font-mono">{code.usedBy || '—'}</td>
                      <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">
                        {new Date(code.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {code.status !== 'USED' && (
                          <button
                            onClick={() => handleToggleCodeStatus(code.id, code.status)}
                            className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold transition-colors ${
                              code.status === 'ACTIVE'
                                ? 'bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 border border-rose-500/30'
                                : 'bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {code.status === 'ACTIVE' ? 'REVOKE' : 'ACTIVATE'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
