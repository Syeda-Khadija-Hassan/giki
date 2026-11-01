/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { api } from '../../services/api';
import { GatePass } from '../../types';
import {
  ShieldCheck,
  QrCode,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  LogOut,
  LogIn,
  Search,
  Sparkles,
  UserCheck,
  Clock,
  MapPin,
} from 'lucide-react';

interface GateSecurityTerminalProps {
  approvedPasses: GatePass[];
  onPassUpdated: (updatedPass: GatePass) => void;
}

export const GateSecurityTerminal: React.FC<GateSecurityTerminalProps> = ({
  approvedPasses,
  onPassUpdated,
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleVerify = async (tokenToVerify?: string) => {
    const token = (tokenToVerify || tokenInput).trim();
    if (!token) {
      setError('Please provide a signed gate pass token.');
      return;
    }

    setLoading(true);
    setError(null);
    setVerificationResult(null);
    setActionSuccess(null);

    try {
      const res = await api.verifyGatePass(token);
      setVerificationResult(res);
      setTokenInput(token);
    } catch (err: any) {
      setError(err?.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogExit = async () => {
    if (!tokenInput.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.logExit(tokenInput.trim());
      setActionSuccess(`Departure recorded at ${new Date(res.action_time).toLocaleTimeString()}!`);
      // Re-verify to refresh state
      await handleVerify(tokenInput.trim());
    } catch (err: any) {
      setError(err?.message || 'Failed to log exit.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogReturn = async () => {
    if (!tokenInput.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.logReturn(tokenInput.trim());
      setActionSuccess(`Safe return to campus recorded at ${new Date(res.action_time).toLocaleTimeString()}!`);
      await handleVerify(tokenInput.trim());
    } catch (err: any) {
      setError(err?.message || 'Failed to log return.');
    } finally {
      setLoading(false);
    }
  };

  const handleTamperTest = () => {
    if (tokenInput.trim()) {
      const tampered = tokenInput.trim() + 'TAMPERED';
      setTokenInput(tampered);
      handleVerify(tampered);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-blue-300 uppercase font-bold block">
                GIKI MAIN GATE SECURITY POST
              </span>
              <h2 className="text-lg font-extrabold tracking-tight">
                Digital Gate Pass Cryptographic Verification Terminal
              </h2>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-blue-900/40 border border-blue-700/40 px-3 py-1.5 rounded-xl text-xs font-mono text-blue-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>HMAC-SHA256 Timing-Safe</span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Token Input Bar */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Scan or Enter HMAC-SHA256 Token (Format: GW-PASS-&#123;id&#125;-&#123;hash&#125;)
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="e.g. GW-PASS-101-7fa8d9e23..."
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
            </div>
            <button
              onClick={() => handleVerify()}
              disabled={loading}
              className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              {loading ? 'Verifying...' : 'Verify Pass'}
            </button>
            {tokenInput && (
              <button
                onClick={handleTamperTest}
                className="bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-semibold px-3 py-2 rounded-xl text-xs transition cursor-pointer"
                title="Test cryptographic anti-tamper security by corrupting the token signature"
              >
                Simulate Tamper
              </button>
            )}
          </div>
        </div>

        {/* Quick Pick Approved Passes for Testing */}
        {approvedPasses.length > 0 && (
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Recently Issued Approved Passes (Click to Load & Test):
            </span>
            <div className="flex flex-wrap gap-2">
              {approvedPasses.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    if (p.signed_token) {
                      setTokenInput(p.signed_token);
                      handleVerify(p.signed_token);
                    }
                  }}
                  className="bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 px-3 py-1.5 rounded-xl text-xs text-left transition cursor-pointer shadow-2xs"
                >
                  <span className="font-bold text-slate-800 block">{p.student_name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Pass #{p.id} • {p.destination}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Alert / Result Cards */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-900 text-xs flex items-start gap-3 animate-in fade-in">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-rose-950 mb-0.5">Verification Rejected!</h4>
              <p className="leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {actionSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-950 text-xs flex items-start gap-3 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-emerald-950 mb-0.5">Checkpoint Logged!</h4>
              <p className="leading-relaxed">{actionSuccess}</p>
            </div>
          </div>
        )}

        {verificationResult && verificationResult.success && (
          <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-50/80 to-teal-50/50 border-2 border-emerald-500/40 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-200/60">
              <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-base">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <span>PASS AUTHENTICATED & CRYPTOGRAPHICALLY VERIFIED</span>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                Authorized for Exit
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-white p-3 rounded-xl border border-emerald-200">
                <span className="text-slate-400 block font-medium">Student Identity</span>
                <h4 className="font-bold text-slate-900 text-sm">{verificationResult.student_name}</h4>
                <p className="text-[11px] font-mono text-slate-500">
                  Reg: {verificationResult.registration_number || '2024626'}
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-emerald-200">
                <span className="text-slate-400 block font-medium">Destination</span>
                <h4 className="font-bold text-slate-900 text-sm">{verificationResult.destination}</h4>
                <p className="text-[11px] text-slate-500">Verified campus itinerary</p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-emerald-200">
                <span className="text-slate-400 block font-medium">Expected Return Window</span>
                <span className="font-bold text-slate-900 text-xs">
                  {new Date(verificationResult.expected_return_time).toLocaleString()}
                </span>
                <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">Within permissible time</p>
              </div>
            </div>

            {/* Checkpoint Exit & Return Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={handleLogExit}
                disabled={loading}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                Log Departure (Exit Campus)
              </button>

              <button
                onClick={handleLogReturn}
                disabled={loading}
                className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                Log Return (Back on Campus)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
