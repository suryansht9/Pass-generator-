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
  Utensils,
  Download,
  Loader2,
  XCircle,
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
  checkedIn: boolean;
  foodPassGenerated: boolean;
  foodPassId?: string | null;
  foodReceived: boolean;
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
  checkedIn: boolean;
  foodPassGenerated: boolean;
  foodPassId?: string | null;
  foodReceived: boolean;
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

interface WhitelistStats {
  totalCapacity: number;
  totalPreRegistered: number;
  claimedPasses: number;
  pendingPasses: number;
  remainingSlots: number;
  totalCheckedIn?: number;
  totalFoodPasses?: number;
  totalFoodReceived?: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'whitelist' | 'participants' | 'access-codes'>('whitelist');

  // Stats
  const [whitelistStats, setWhitelistStats] = useState<WhitelistStats>({
    totalCapacity: 200,
    totalPreRegistered: 0,
    claimedPasses: 0,
    pendingPasses: 0,
    remainingSlots: 200,
    totalCheckedIn: 0,
    totalFoodPasses: 0,
    totalFoodReceived: 0,
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
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Access Code Creation State
  const [newCustomCode, setNewCustomCode] = useState('');
  const [isGeneratingCodes, setIsGeneratingCodes] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch Participants
  const fetchParticipants = async (query = '') => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/participants?q=${encodeURIComponent(query)}&_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      if (data.success) {
        setParticipants(data.participants);
      }
    } catch (err) {
      console.error('Failed to fetch participants:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Whitelist & Compute Dashboard Analytics
  const fetchWhitelist = async (query = '') => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/whitelist?q=${encodeURIComponent(query)}&_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      if (data.success) {
        setWhitelist(data.whitelist);

        // Compute exact counts for analytics counters
        const totalCheckedIn = data.whitelist.filter((w: WhitelistItem) => w.checkedIn).length;
        const totalFoodPasses = data.whitelist.filter((w: WhitelistItem) => w.foodPassGenerated).length;
        const totalFoodReceived = data.whitelist.filter((w: WhitelistItem) => w.foodReceived).length;

        setWhitelistStats({
          ...data.stats,
          totalCheckedIn,
          totalFoodPasses,
          totalFoodReceived,
        });
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
      const res = await fetch(`/api/admin/access-codes?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
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

  // Download Excel-Compatible CSV Export
  const handleExportExcel = async () => {
    try {
      setIsExportingExcel(true);
      window.location.href = '/api/admin/export-excel';
    } catch (err) {
      console.error('Export Excel error:', err);
    } finally {
      setTimeout(() => setIsExportingExcel(false), 2000);
    }
  };

  // Single Add Whitelist Participant
  const handleAddSingleWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleEmail.trim()) {
      alert('Email address is required for pre-registration whitelist.');
      return;
    }

    try {
      const res = await fetch('/api/admin/whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
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
        
        // Immediate confirmed state update + background refetch
        if (data.participant) {
          setWhitelist((prev) => [data.participant, ...prev.filter((p) => p.id !== data.participant.id)]);
        }
        await fetchWhitelist();
      }
    } catch (err: any) {
      console.error('Add single error:', err);
      alert('Network error while adding participant: ' + (err?.message || 'Please try again.'));
    }
  };

  // Bulk Import CSV
  const handleBulkCsvImport = async () => {
    if (!csvText.trim()) return;

    try {
      setIsImportingCsv(true);
      const lines = csvText.split('\n');
      const parsedItems = [];

      for (const line of lines) {
        const parts = line.split(',').map((p) => p.trim());
        if (parts.length >= 1 && parts[0]) {
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

  // Independent Status Toggles (checkedIn & foodReceived)
  const handleToggleStatusField = async (id: string, type: 'checkedIn' | 'foodReceived', currentValue: boolean) => {
    try {
      const res = await fetch('/api/admin/toggle-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type, value: !currentValue }),
      });
      if (res.ok) {
        fetchWhitelist(searchQuery);
        fetchParticipants(searchQuery);
      }
    } catch (err) {
      console.error('Toggle status error:', err);
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

  // Toggle Main Pass Revocation
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
        fetchWhitelist(searchQuery);
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
      {/* HEADER BAR & EXCEL EXPORT BUTTON */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-brand-border/60 pb-6">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
            Organizer Admin Portal
          </h1>
          <p className="text-xs text-brand-muted">
            Code for Community Hackathon • CMP Hack Squad × GDG Prayagraj
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* VIEW ALL ACTIONS BUTTON */}
          <Link
            href="/admin/actions"
            className="p-2.5 bg-brand-red hover:bg-red-600 text-white rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 transition-colors shadow-lg shadow-brand-red/20"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>VIEW ALL ACTIONS</span>
          </Link>

          {/* VIEW DATA IN EXCEL BUTTON */}
          <button
            onClick={handleExportExcel}
            disabled={isExportingExcel}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isExportingExcel ? 'Exporting...' : 'VIEW DATA IN EXCEL'}</span>
          </button>

          <button
            onClick={() => {
              fetchWhitelist(searchQuery);
              fetchParticipants(searchQuery);
              fetchAccessCodes();
            }}
            className="p-2.5 bg-brand-card hover:bg-white/10 text-gray-300 rounded-xl border border-brand-border text-xs font-mono flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-red-400" />
            <span>Refresh</span>
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

      {/* STATS ANALYTICS COUNTERS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-brand-card p-5 rounded-2xl border border-brand-border/80 space-y-1 shadow-lg">
          <div className="text-[11px] font-mono text-gray-400 uppercase tracking-wider flex items-center justify-between">
            <span>REGISTERED</span>
            <Users className="w-4 h-4 text-red-400" />
          </div>
          <div className="font-display font-black text-2xl sm:text-3xl text-white">
            {whitelistStats.totalPreRegistered}
          </div>
          <p className="text-[10px] text-gray-500 font-mono">Whitelisted Emails</p>
        </div>

        <div className="bg-brand-card p-5 rounded-2xl border border-brand-border/80 space-y-1 shadow-lg">
          <div className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider flex items-center justify-between">
            <span>MAIN PASSES</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-display font-black text-2xl sm:text-3xl text-emerald-400">
            {whitelistStats.claimedPasses}
          </div>
          <p className="text-[10px] text-gray-500 font-mono">Generated Entry Passes</p>
        </div>

        <div className="bg-brand-card p-5 rounded-2xl border border-brand-border/80 space-y-1 shadow-lg">
          <div className="text-[11px] font-mono text-sky-400 uppercase tracking-wider flex items-center justify-between">
            <span>CHECKED IN</span>
            <ShieldCheck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="font-display font-black text-2xl sm:text-3xl text-sky-400">
            {whitelistStats.totalCheckedIn || 0}
          </div>
          <p className="text-[10px] text-gray-500 font-mono">Event Gate Entry</p>
        </div>

        <div className="bg-brand-card p-5 rounded-2xl border border-brand-border/80 space-y-1 shadow-lg">
          <div className="text-[11px] font-mono text-amber-400 uppercase tracking-wider flex items-center justify-between">
            <span>FOOD PASSES</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-display font-black text-2xl sm:text-3xl text-amber-400">
            {whitelistStats.totalFoodPasses || 0}
          </div>
          <p className="text-[10px] text-gray-500 font-mono">Food Passes Issued</p>
        </div>

        <div className="bg-brand-card p-5 rounded-2xl border border-brand-border/80 space-y-1 shadow-lg col-span-2 lg:col-span-1">
          <div className="text-[11px] font-mono text-emerald-300 uppercase tracking-wider flex items-center justify-between">
            <span>FOOD RECEIVED</span>
            <Utensils className="w-4 h-4 text-emerald-300" />
          </div>
          <div className="font-display font-black text-2xl sm:text-3xl text-emerald-300">
            {whitelistStats.totalFoodReceived || 0}
          </div>
          <p className="text-[10px] text-gray-500 font-mono">Meals Distributed</p>
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
          <span>Email Whitelist ({whitelist.length})</span>
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

      {/* TAB 1: PRE-REGISTERED EMAIL WHITELIST & TRACKING */}
      {activeTab === 'whitelist' && (
        <div className="space-y-6">
          {/* INPUT TOOLS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Single Add Form */}
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

          {/* Search & Whitelist Table with Independent Check-in & Food Tracking */}
          <div className="space-y-4">
            <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-lg">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search by email, name, college, team..."
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
                    <th className="py-3.5 px-4">PARTICIPANT ID</th>
                    <th className="py-3.5 px-4">EMAIL</th>
                    <th className="py-3.5 px-4">NAME</th>
                    <th className="py-3.5 px-4">COLLEGE</th>
                    <th className="py-3.5 px-4">PASS STATUS</th>
                    <th className="py-3.5 px-4">CHECK-IN</th>
                    <th className="py-3.5 px-4">FOOD PASS</th>
                    <th className="py-3.5 px-4">FOOD RECEIVED</th>
                    <th className="py-3.5 px-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/60 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-gray-400 font-mono">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-red" />
                        Loading whitelist records...
                      </td>
                    </tr>
                  ) : whitelist.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-gray-400 font-mono">
                        No pre-registered emails in whitelist.
                      </td>
                    </tr>
                  ) : (
                    whitelist.map((w) => (
                      <tr key={w.id} className="hover:bg-white/5 transition-colors">
                        {/* ID */}
                        <td className="py-3 px-4 font-mono font-bold text-red-400">
                          {w.participantId || '—'}
                        </td>

                        {/* Email */}
                        <td className="py-3 px-4 font-mono font-bold text-white">
                          {w.email || '—'}
                        </td>

                        {/* Name */}
                        <td className="py-3 px-4 text-gray-200 font-semibold">{w.fullName}</td>

                        {/* College */}
                        <td className="py-3 px-4 text-gray-300">{w.collegeName}</td>

                        {/* Main Pass Status */}
                        <td className="py-3 px-4">
                          {w.status === 'CLAIMED' ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono text-[10px] font-bold">
                              PASS CLAIMED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono text-[10px] font-bold">
                              PENDING
                            </span>
                          )}
                        </td>

                        {/* CHECK-IN STATUS (Independent Toggle) */}
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleStatusField(w.id, 'checkedIn', w.checkedIn)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all flex items-center gap-1 ${
                              w.checkedIn
                                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                                : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
                            }`}
                          >
                            {w.checkedIn ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-sky-400" />
                                <span>✓ Checked In</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 text-gray-500" />
                                <span>✕ Not Checked In</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* FOOD PASS STATUS */}
                        <td className="py-3 px-4">
                          {w.foodPassGenerated ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono text-[10px] font-bold">
                              ✓ {w.foodPassId || 'Food Pass'}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10 font-mono text-[10px]">
                              ✕ No Pass
                            </span>
                          )}
                        </td>

                        {/* FOOD RECEIVED STATUS (Independent Toggle) */}
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleStatusField(w.id, 'foodReceived', w.foodReceived)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all flex items-center gap-1 ${
                              w.foodReceived
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
                            }`}
                          >
                            {w.foodReceived ? (
                              <>
                                <Utensils className="w-3 h-3 text-emerald-300" />
                                <span>✓ Food Received</span>
                              </>
                            ) : (
                              <>
                                <Utensils className="w-3 h-3 text-gray-500" />
                                <span>✕ Not Received</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right space-x-2">
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

      {/* TAB 2: GENERATED MAIN PASSES */}
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
                  <th className="py-3.5 px-4">CHECK-IN</th>
                  <th className="py-3.5 px-4">FOOD PASS</th>
                  <th className="py-3.5 px-4">FOOD RECEIVED</th>
                  <th className="py-3.5 px-4">STATUS</th>
                  <th className="py-3.5 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/60 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-gray-400 font-mono">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-red" />
                      Loading generated pass records...
                    </td>
                  </tr>
                ) : participants.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-gray-400 font-mono">
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

                      {/* Check-in */}
                      <td className="py-3 px-4 font-mono font-bold">
                        {p.checkedIn ? (
                          <span className="text-sky-400 font-bold">✓ Checked In</span>
                        ) : (
                          <span className="text-gray-500">✕ Not Checked In</span>
                        )}
                      </td>

                      {/* Food Pass Generated */}
                      <td className="py-3 px-4 font-mono font-bold">
                        {p.foodPassGenerated ? (
                          <span className="text-emerald-400 font-bold">✓ {p.foodPassId || 'Food Pass'}</span>
                        ) : (
                          <span className="text-gray-500">✕ No Pass</span>
                        )}
                      </td>

                      {/* Food Received */}
                      <td className="py-3 px-4 font-mono font-bold">
                        {p.foodReceived ? (
                          <span className="text-emerald-300 font-bold">✓ Food Received</span>
                        ) : (
                          <span className="text-gray-500">✕ Not Received</span>
                        )}
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
                      <td className="py-3 px-4 text-right space-x-2">
                        <Link
                          href={`/pass/${p.participantId}`}
                          target="_blank"
                          className="inline-flex p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
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
