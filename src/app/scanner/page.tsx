'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, CheckCircle2, AlertTriangle, ShieldX, User, Building, Users, Award, Camera, RefreshCw, X } from 'lucide-react';

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

export default function OrganizerScannerPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-reader-container';

  // Initialize and start scanner
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

  // Stop scanner
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
    // Extract participant ID or token from scanned text/URL
    // e.g. "https://domain.com/verify/CFC-2026-0001" or "CFC-2026-0001"
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

  // Verify Participant ID via API
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

  useEffect(() => {
    // Auto-start camera when page loads
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="py-8 px-4 sm:px-6 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-red/10 border border-brand-red/30 text-xs font-mono text-red-400">
          <QrCode className="w-3.5 h-3.5" />
          <span>ORGANIZER CHECK-IN SCANNER</span>
        </div>
        <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
          Scan Participant Pass
        </h1>
        <p className="text-xs text-brand-muted">
          Point device camera at the entry pass QR code for instant check-in verification.
        </p>
      </div>

      {/* CAMERA SCANNER BOX */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-4 shadow-2xl relative overflow-hidden">
        {/* Scanner HTML Element */}
        <div
          id={scannerContainerId}
          className="w-full rounded-xl overflow-hidden min-h-[260px] bg-black flex items-center justify-center border border-white/10"
        />

        {/* Controls Overlay */}
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

      {/* VERIFICATION RESULT CARD MODAL */}
      {scanResult && (
        <div className="bg-brand-card border-2 border-brand-border rounded-2xl overflow-hidden shadow-2xl space-y-0 animate-in fade-in duration-200">
          {scanResult.status === 'VALID' && (
            <div className="bg-emerald-600 p-4 text-center text-white space-y-1">
              <CheckCircle2 className="w-10 h-10 mx-auto text-white" />
              <h2 className="font-display font-black text-xl tracking-wide uppercase">✓ VALID PASS</h2>
              <p className="text-xs font-mono text-emerald-100">CONFIRMED HACKATHON PARTICIPANT</p>
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

      {/* MANUAL INPUT FALLBACK */}
      <div className="bg-brand-dark/80 border border-brand-border rounded-xl p-4 space-y-3">
        <div className="text-xs font-mono text-gray-400 font-semibold uppercase tracking-wider">
          Or Verify Manually
        </div>
        <form onSubmit={handleManualVerify} className="flex gap-2">
          <input
            type="text"
            placeholder="Type ID (e.g. CFC-2026-0001)"
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
  );
}
