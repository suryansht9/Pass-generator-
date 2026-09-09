'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  ShieldX,
  User,
  Building,
  Users,
  Award,
  Camera,
  RefreshCw,
  X,
  Utensils,
  Search,
} from 'lucide-react';

interface ScanResult {
  status: 'VALID' | 'REVOKED' | 'INVALID' | 'ERROR';
  participant?: {
    participantId: string;
    fullName: string;
    collegeName: string;
    teamName: string;
    photoUrl: string;
    status: string;
  };
  scannedText?: string;
}

interface FoodResult {
  status: 'SUCCESS' | 'ALREADY_RECEIVED' | 'INVALID' | 'REVOKED' | 'ERROR';
  message?: string;
  error?: string;
  participant?: {
    fullName: string;
    email?: string | null;
    teamName: string;
    collegeName: string;
    participantId: string;
    foodPassId?: string | null;
    foodReceived: boolean;
  };
}

export default function OrganizerScannerPage() {
  // Main Pass QR Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Food Verification State
  const [foodPassInput, setFoodPassInput] = useState('');
  const [isVerifyingFood, setIsVerifyingFood] = useState(false);
  const [foodResult, setFoodResult] = useState<FoodResult | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-reader-container';

  // Initialize and start scanner for Main Pass QR
  const startCamera = async () => {
    try {
      setCameraError(null);
      setScanResult(null);

      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
        } catch (e) {
          // Ignore error if not running
        }
      }

      const html5QrCode = new Html5Qrcode(scannerContainerId);
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' }, // Rear camera on mobile
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        onScanSuccess,
        onScanError
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error('Camera start error:', err);
      setCameraError(
        'Unable to access camera. Please allow camera permissions or use manual ID verification below.'
      );
      setIsScanning(false);
    }
  };

  // Stop camera scanner
  const stopCamera = async () => {
    if (html5QrCodeRef.current && isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        setIsScanning(false);
      } catch (e) {
        console.error('Error stopping camera:', e);
      }
    }
  };

  // Callback on successful QR scan
  const onScanSuccess = async (decodedText: string) => {
    let extractedId = decodedText.trim();
    if (extractedId.includes('/verify/')) {
      extractedId = extractedId.split('/verify/').pop()?.split('/')[0] || extractedId;
    }

    await stopCamera();
    await verifyParticipantId(extractedId, decodedText);
  };

  const onScanError = (errorMessage: string) => {
    // Silent ignore frame scanning noise
  };

  // Verify Main Pass Participant ID via API
  const verifyParticipantId = async (id: string, fullScannedText?: string) => {
    try {
      setIsVerifying(true);
      const res = await fetch(`/api/verify/${encodeURIComponent(id)}`);
      const data = await res.json();

      setScanResult({
        status: data.status,
        participant: data.participant,
        scannedText: fullScannedText || id,
      });
    } catch (err) {
      setScanResult({
        status: 'ERROR',
        scannedText: id,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManualVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      verifyParticipantId(manualInput.trim());
    }
  };

  // VERIFY FOOD PASS ID VIA API
  const handleFoodVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodPassInput.trim()) return;

    try {
      setIsVerifyingFood(true);
      setFoodResult(null);

      const res = await fetch('/api/food/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodPassId: foodPassInput.trim() }),
      });

      const data = await res.json();

      setFoodResult({
        status: data.status,
        message: data.message,
        error: data.error,
        participant: data.participant,
      });
    } catch (err: any) {
      setFoodResult({
        status: 'ERROR',
        error: 'Failed to verify Food Pass. Network or server error.',
      });
    } finally {
      setIsVerifyingFood(false);
    }
  };

  useEffect(() => {
    // Auto-start camera when page loads
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="py-8 px-4 sm:px-6 max-w-lg mx-auto space-y-8">
      {/* SECTION 1: MAIN HACKATHON PASS SCANNER */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-red/10 border border-brand-red/30 text-xs font-mono text-red-400">
            <QrCode className="w-3.5 h-3.5" />
            <span>ORGANIZER ENTRY CHECK-IN SCANNER</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
            Scan Main Hackathon Pass
          </h1>
          <p className="text-xs text-brand-muted">
            Point device camera at the entry pass QR code for instant check-in verification.
          </p>
        </div>

        {/* CAMERA SCANNER BOX */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-4 shadow-2xl relative overflow-hidden">
          <div
            id={scannerContainerId}
            className="w-full rounded-xl overflow-hidden min-h-[260px] bg-black flex items-center justify-center border border-white/10"
          />

          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={isScanning ? stopCamera : startCamera}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-mono font-bold transition-colors"
            >
              {isScanning ? (
                <>
                  <X className="w-4 h-4 text-rose-400" />
                  <span>STOP CAMERA</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span>START CAMERA</span>
                </>
              )}
            </button>

            {scanResult && (
              <button
                onClick={() => {
                  setScanResult(null);
                  startCamera();
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-brand-red hover:bg-red-600 text-white rounded-lg text-xs font-mono font-bold transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>SCAN NEXT PASS</span>
              </button>
            )}
          </div>

          {cameraError && (
            <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {cameraError}
            </div>
          )}
        </div>

        {/* MAIN PASS VERIFICATION RESULT CARD */}
        {scanResult && (
          <div className="bg-brand-card border-2 border-brand-border rounded-2xl overflow-hidden shadow-2xl space-y-0 animate-in fade-in duration-200">
            {scanResult.status === 'VALID' && (
              <div className="bg-emerald-600 p-4 text-center text-white space-y-1">
                <CheckCircle2 className="w-10 h-10 mx-auto text-white" />
                <h2 className="font-display font-black text-xl tracking-wide uppercase">✓ VALID ENTRY PASS</h2>
                <p className="text-xs font-mono text-emerald-100">ENTRY CHECK-IN CONFIRMED</p>
              </div>
            )}

            {scanResult.status === 'REVOKED' && (
              <div className="bg-amber-600 p-4 text-center text-white space-y-1">
                <AlertTriangle className="w-10 h-10 mx-auto text-white" />
                <h2 className="font-display font-black text-xl tracking-wide uppercase">⚠ PASS REVOKED</h2>
                <p className="text-xs font-mono text-amber-100">ENTRY DENIED - REVOKED PASS</p>
              </div>
            )}

            {(scanResult.status === 'INVALID' || scanResult.status === 'ERROR') && (
              <div className="bg-rose-700 p-4 text-center text-white space-y-1">
                <ShieldX className="w-10 h-10 mx-auto text-white" />
                <h2 className="font-display font-black text-xl tracking-wide uppercase">✕ INVALID PASS</h2>
                <p className="text-xs font-mono text-rose-200">UNAUTHORIZED OR BAD QR CODE</p>
              </div>
            )}

            {scanResult.participant && (
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-4 border-b border-brand-border/60 pb-4">
                  <img
                    src={scanResult.participant.photoUrl}
                    alt={scanResult.participant.fullName}
                    className="w-16 h-16 rounded-xl object-cover border border-white/20 shadow-md"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://ui-avatars.com/api/?name=' +
                        encodeURIComponent(scanResult.participant!.fullName) +
                        '&background=111318&color=fff&size=200';
                    }}
                  />
                  <div>
                    <h3 className="font-bold text-lg text-white">{scanResult.participant.fullName}</h3>
                    <div className="font-mono text-xs text-red-400 font-bold">
                      {scanResult.participant.participantId}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-mono">College:</span>
                    <span className="text-gray-200 font-semibold">{scanResult.participant.collegeName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-mono">Team:</span>
                    <span className="text-gray-200 font-semibold">{scanResult.participant.teamName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-mono">Status:</span>
                    <span
                      className={`font-mono font-bold ${
                        scanResult.status === 'VALID' ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {scanResult.participant.status}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MANUAL MAIN PASS INPUT FALLBACK */}
        <div className="bg-brand-dark/80 border border-brand-border rounded-xl p-4 space-y-3">
          <div className="text-xs font-mono text-gray-400 font-semibold uppercase tracking-wider">
            Or Verify Main Pass Manually
          </div>
          <form onSubmit={handleManualVerify} className="flex gap-2">
            <input
              type="text"
              placeholder="Type Main Pass ID (e.g. CFC-2026-0001)"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className="flex-1 px-3 py-2 bg-brand-card border border-brand-border rounded-lg text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-brand-red"
            />
            <button
              type="submit"
              disabled={isVerifying}
              className="px-4 py-2 bg-brand-red hover:bg-red-600 text-white font-mono text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
            >
              {isVerifying ? 'Checking...' : 'Verify'}
            </button>
          </form>
        </div>
      </div>

      <hr className="border-brand-border/60" />

      {/* SECTION 2: FOOD RECEIVING VERIFICATION */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-400">
            <Utensils className="w-3.5 h-3.5" />
            <span>FOOD RECEIVING VERIFICATION</span>
          </div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-white">
            Verify Food Pass
          </h2>
          <p className="text-xs text-brand-muted">
            Enter participant Food Pass ID to verify meal distribution at the food counter.
          </p>
        </div>

        {/* FOOD VERIFICATION FORM CARD */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-5 space-y-4 shadow-2xl">
          <form onSubmit={handleFoodVerify} className="space-y-3">
            <label className="block text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
              Enter Food Pass Number / Food Pass ID
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder="e.g. FOOD-2026-0001 or FP-0001"
                value={foodPassInput}
                onChange={(e) => setFoodPassInput(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-3 bg-brand-dark border border-brand-border rounded-xl text-sm font-mono text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 uppercase tracking-wider"
              />
              <button
                type="submit"
                disabled={isVerifyingFood || !foodPassInput.trim()}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-lg shadow-emerald-600/20"
              >
                {isVerifyingFood ? (
                  <span>Checking...</span>
                ) : (
                  <>
                    <Utensils className="w-4 h-4" />
                    <span>VERIFY FOOD PASS</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* FOOD VERIFICATION RESULT DISPLAY */}
          {foodResult && (
            <div className="mt-4 border-2 border-brand-border rounded-xl overflow-hidden shadow-xl animate-in fade-in duration-200">
              {/* SUCCESS Banner */}
              {foodResult.status === 'SUCCESS' && (
                <div className="bg-emerald-600 p-4 text-center text-white space-y-1">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-white" />
                  <h3 className="font-display font-black text-xl tracking-wide uppercase">
                    ✓ FOOD PASS VERIFIED
                  </h3>
                  <p className="text-xs font-mono text-emerald-100">MEAL MARKED AS DISTRIBUTED</p>
                </div>
              )}

              {/* ALREADY RECEIVED Banner */}
              {foodResult.status === 'ALREADY_RECEIVED' && (
                <div className="bg-amber-600 p-4 text-center text-white space-y-1">
                  <AlertTriangle className="w-10 h-10 mx-auto text-white" />
                  <h3 className="font-display font-black text-xl tracking-wide uppercase">
                    ⚠ FOOD ALREADY RECEIVED
                  </h3>
                  <p className="text-xs font-mono text-amber-100">
                    MEAL WAS ALREADY CLAIMED FOR THIS FOOD PASS
                  </p>
                </div>
              )}

              {/* INVALID Banner */}
              {foodResult.status === 'INVALID' && (
                <div className="bg-rose-700 p-4 text-center text-white space-y-1">
                  <ShieldX className="w-10 h-10 mx-auto text-white" />
                  <h3 className="font-display font-black text-xl tracking-wide uppercase">
                    ✕ INVALID FOOD PASS
                  </h3>
                  <p className="text-xs font-mono text-rose-200">
                    {foodResult.error || 'Food Pass ID not found in database.'}
                  </p>
                </div>
              )}

              {/* REVOKED Banner */}
              {foodResult.status === 'REVOKED' && (
                <div className="bg-rose-800 p-4 text-center text-white space-y-1">
                  <AlertTriangle className="w-10 h-10 mx-auto text-white" />
                  <h3 className="font-display font-black text-xl tracking-wide uppercase">
                    ✕ PARTICIPANT REVOKED
                  </h3>
                  <p className="text-xs font-mono text-rose-200">REGISTRATION HAS BEEN REVOKED</p>
                </div>
              )}

              {/* Participant Details */}
              {foodResult.participant && (
                <div className="p-5 space-y-3 bg-brand-dark/90 text-xs">
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-gray-400 font-mono">Participant Name:</span>
                    <span className="text-white font-bold">{foodResult.participant.fullName}</span>
                  </div>
                  {foodResult.participant.email && (
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <span className="text-gray-400 font-mono">Email:</span>
                      <span className="text-gray-200 font-mono font-semibold">
                        {foodResult.participant.email}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-gray-400 font-mono">Team:</span>
                    <span className="text-gray-200 font-semibold">
                      {foodResult.participant.teamName}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-gray-400 font-mono">Participant ID:</span>
                    <span className="text-red-400 font-mono font-bold">
                      {foodResult.participant.participantId}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-gray-400 font-mono">Food Pass ID:</span>
                    <span className="text-emerald-400 font-mono font-bold">
                      {foodResult.participant.foodPassId || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-gray-400 font-mono">Food Received:</span>
                    <span
                      className={`font-mono font-bold ${
                        foodResult.participant.foodReceived ? 'text-emerald-300' : 'text-amber-400'
                      }`}
                    >
                      {foodResult.participant.foodReceived ? '✓ YES' : '✕ NO'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
