'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { Upload, X, CheckCircle2, Ticket, Key, AlertCircle, Loader2, ShieldX, ExternalLink, Mail } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();

  // Form State
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Status & Validation State
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUnregistered, setIsUnregistered] = useState(false);
  const [claimedParticipantId, setClaimedParticipantId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle Photo Selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setIsUnregistered(false);
    setClaimedParticipantId(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setErrorMsg('Invalid photo format. Please upload JPG, JPEG, PNG, or WEBP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 5MB. Please upload a smaller image.');
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Remove Photo
  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsUnregistered(false);
    setClaimedParticipantId(null);

    // Validation
    if (!email.trim()) {
      setErrorMsg('Please enter your Email Address.');
      return;
    }
    if (!fullName.trim()) {
      setErrorMsg('Please enter your Full Name.');
      return;
    }
    if (!collegeName.trim()) {
      setErrorMsg('Please enter your College Name.');
      return;
    }
    if (!teamName.trim()) {
      setErrorMsg('Please enter your Team Name.');
      return;
    }
    if (!photoFile && !photoPreview) {
      setErrorMsg('Please upload your Profile Photo.');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitStatus('Verifying email whitelist...');

      // Step 1: Upload Image
      let photoUrl = photoPreview;
      if (photoFile) {
        setIsUploading(true);
        const uploadFormData = new FormData();
        uploadFormData.append('photo', photoFile);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || 'Failed to upload photo.');
        }
        photoUrl = uploadData.photoUrl;
      }

      // Step 2: Register Participant & Verify Email Whitelist
      setSubmitStatus('Creating your pass...');
      const registerRes = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          fullName: fullName.trim(),
          collegeName: collegeName.trim(),
          teamName: teamName.trim(),
          accessCode: accessCode.trim(),
          photoUrl,
        }),
      });

      const registerData = await registerRes.json();

      if (!registerRes.ok) {
        if (registerData.isUnregistered) {
          setIsUnregistered(true);
        }
        if (registerData.isAlreadyClaimed && registerData.participantId) {
          setClaimedParticipantId(registerData.participantId);
        }
        throw new Error(registerData.error || 'Registration failed.');
      }

      setSubmitStatus('PASS GENERATED ✓');

      // Trigger Celebration Confetti
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#EF1D25', '#ffffff', '#FFD700'],
      });

      // Redirect to pass page after short delay
      setTimeout(() => {
        router.push(`/pass/${registerData.participantId}`);
      }, 1200);
    } catch (err: any) {
      console.error('Registration submit error:', err);
      setErrorMsg(err.message || 'An unexpected error occurred. Please try again.');
      setSubmitStatus(null);
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  return (
    <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-3 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-red/10 border border-brand-red/30 text-xs font-mono text-brand-red font-bold">
          <Ticket className="w-3.5 h-3.5" />
          <span>EMAIL-VERIFIED PASS GENERATION</span>
        </div>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
          Create Your Hackathon Pass
        </h1>
        <p className="text-sm text-brand-muted">
          Enter your registered email address to verify your selection and generate your official pass.
        </p>
      </div>

      {/* UNREGISTERED EMAIL ERROR BANNER */}
      {isUnregistered && (
        <div className="mb-6 p-5 rounded-2xl bg-rose-950/90 border-2 border-rose-500 text-white space-y-2 shadow-2xl animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-rose-400 font-display font-bold text-lg">
            <ShieldX className="w-6 h-6 flex-shrink-0" />
            <span>Registration Denied</span>
          </div>
          <p className="text-sm text-rose-100 font-medium">
            Your email address is not registered for this hackathon. Please contact the organizers.
          </p>
          <div className="text-xs font-mono text-rose-300/80 pt-1">
            CMP Hack Squad × GDG Prayagraj • Official Participant Selection
          </div>
        </div>
      )}

      {/* ALREADY CLAIMED BANNER */}
      {claimedParticipantId && (
        <div className="mb-6 p-5 rounded-2xl bg-sky-950/90 border-2 border-sky-500 text-white space-y-3 shadow-2xl">
          <div className="flex items-center gap-2 text-sky-400 font-display font-bold text-lg">
            <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
            <span>Pass Already Generated</span>
          </div>
          <p className="text-sm text-sky-100 font-medium">
            A hackathon pass has already been generated for this email address. Click below to view and download your pass.
          </p>
          <div>
            <Link
              href={`/pass/${claimedParticipantId}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-mono text-xs font-bold rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>VIEW YOUR PASS ({claimedParticipantId})</span>
            </Link>
          </div>
        </div>
      )}

      {/* Generic Error Alert */}
      {errorMsg && !isUnregistered && !claimedParticipantId && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>{errorMsg}</div>
        </div>
      )}

      {/* Registration Card Form */}
      <div className="bg-[#141416] border border-[#22242B] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* EMAIL ADDRESS (PRIMARY VERIFICATION CRITERION) */}
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
            <label className="block text-xs font-mono font-semibold text-gray-300 uppercase tracking-wider">
              Full Name <span className="text-brand-red">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Sharma"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 bg-[#080808] border border-[#22242B] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition-all"
            />
          </div>

          {/* COLLEGE NAME */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-semibold text-gray-300 uppercase tracking-wider">
              College Name <span className="text-brand-red">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. CMP Degree College / University of Allahabad"
              value={collegeName}
              onChange={(e) => setCollegeName(e.target.value)}
              className="w-full px-4 py-3 bg-[#080808] border border-[#22242B] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition-all"
            />
          </div>

          {/* TEAM NAME */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-semibold text-gray-300 uppercase tracking-wider">
              Team Name <span className="text-brand-red">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Code Warriors"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full px-4 py-3 bg-[#080808] border border-[#22242B] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition-all"
            />
          </div>

          {/* ACCESS CODE FIELD (OPTIONAL) */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-semibold text-gray-300 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-brand-red" />
                Access Code / Selection Code (Optional)
              </span>
            </label>
            <input
              type="text"
              placeholder="e.g. CFC-PASS-2026"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 bg-[#080808] border border-[#22242B] rounded-xl text-sm font-mono text-white placeholder-gray-500 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition-all"
            />
          </div>

          {/* PROFILE PHOTO UPLOAD WITH INSTANT PREVIEW */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-semibold text-gray-300 uppercase tracking-wider">
              Profile Photo <span className="text-brand-red">*</span>
            </label>

            {photoPreview ? (
              /* Photo Preview Block */
              <div className="flex items-center gap-4 p-4 rounded-xl bg-[#080808] border border-[#22242B]">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-20 h-20 rounded-xl object-cover border border-white/20 shadow-md"
                />
                <div className="flex-1 space-y-1">
                  <div className="text-xs font-semibold text-white truncate">
                    {photoFile ? photoFile.name : 'Selected Photo'}
                  </div>
                  <p className="text-[11px] text-gray-400">JPG, JPEG, PNG or WEBP (Max 5MB)</p>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="inline-flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 transition-colors pt-1 font-mono"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Remove Photo</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Upload Zone */
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-[#22242B] hover:border-brand-red/60 bg-[#080808]/50 hover:bg-[#080808] p-6 rounded-xl text-center space-y-2 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-white/5 group-hover:bg-brand-red/10 flex items-center justify-center mx-auto text-gray-400 group-hover:text-red-400 transition-colors">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-xs font-semibold text-gray-200">
                  Click to upload or drag & drop profile photo
                </div>
                <div className="text-[11px] text-brand-muted">
                  Supports JPG, JPEG, PNG, WEBP (Max 5MB)
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={handlePhotoSelect}
              className="hidden"
            />
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-brand-red hover:bg-red-600 text-white font-mono font-bold text-sm tracking-wider rounded-xl transition-all shadow-lg shadow-brand-red/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{submitStatus || 'Verifying Email Whitelist...'}</span>
                </>
              ) : submitStatus === 'PASS GENERATED ✓' ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                  <span>PASS GENERATED ✓</span>
                </>
              ) : (
                <>
                  <Ticket className="w-5 h-5" />
                  <span>VERIFY EMAIL & GENERATE PASS</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
