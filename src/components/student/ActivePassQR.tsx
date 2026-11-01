/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { GatePass } from '../../types';
import {
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  Copy,
  Check,
  AlertTriangle,
  QrCode,
  Download,
} from 'lucide-react';

interface ActivePassQRProps {
  pass: GatePass;
}

export const ActivePassQR: React.FC<ActivePassQRProps> = ({ pass }) => {
  const [copied, setCopied] = useState(false);

  if (pass.status !== 'APPROVED' || !pass.signed_token) {
    return (
      <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-8 text-center">
        <QrCode className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h4 className="font-bold text-slate-700 text-sm">Digital Gate Pass Not Issued</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          Cryptographic QR pass is generated only after both parental consent (YES via WhatsApp)
          and final hostel warden approval are recorded.
        </p>
      </div>
    );
  }

  const handleCopy = () => {
    if (pass.signed_token) {
      navigator.clipboard.writeText(pass.signed_token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isExpired = new Date().getTime() > new Date(pass.expected_return_time).getTime();

  return (
    <div className="bg-gradient-to-b from-white to-emerald-50/30 rounded-3xl border-2 border-emerald-600/30 shadow-lg overflow-hidden">
      {/* Pass Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-300 font-bold block">
                GIKI FOR WOMEN
              </span>
              <h3 className="font-extrabold text-base tracking-tight">Official Digital Exit Gate Pass</h3>
            </div>
          </div>
          <div className="text-right">
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              {pass.actual_return_time ? 'Completed' : pass.actual_exit_time ? 'Currently Out' : 'Valid for Exit'}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* QR Code Container */}
          <div className="md:col-span-5 flex flex-col items-center justify-center bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="p-3 bg-white rounded-xl ring-4 ring-emerald-500/10">
              <QRCodeSVG
                value={pass.signed_token}
                size={180}
                level="H"
                includeMargin={true}
                className="rounded-lg"
              />
            </div>
            <div className="mt-3 text-center">
              <span className="text-[10px] font-mono text-slate-500 block truncate max-w-[200px]" title={pass.signed_token}>
                {pass.signed_token.slice(0, 18)}...
              </span>
              <button
                onClick={handleCopy}
                className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-800 font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied Token' : 'Copy Signed Token'}
              </button>
            </div>
          </div>

          {/* Gate Pass Details */}
          <div className="md:col-span-7 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs text-slate-400 font-medium">Student Name</span>
                <h4 className="text-base font-bold text-slate-900">{pass.student_name}</h4>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 font-medium">Reg Number</span>
                <p className="text-sm font-mono font-bold text-slate-800">
                  {pass.registration_number || '2024626'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Hostel & Room</span>
                <span className="font-semibold text-slate-800">
                  {pass.hostel || 'Hostel 8'}, Room {pass.room_number || '204'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Registered Guardian</span>
                <span className="font-semibold text-slate-800 truncate block">
                  {pass.parent_name || 'Guardian'}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-bold text-slate-900">{pass.destination}</span>
              </div>
              <p className="text-[11px] text-slate-500 pl-5">Reason: {pass.reason}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[10px] text-emerald-800 font-medium block">Departure Allowed</span>
                <span className="font-bold text-emerald-950 text-xs">
                  {new Date(pass.departure_time).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  at{' '}
                  {new Date(pass.departure_time).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div
                className={`p-2.5 rounded-xl border ${
                  isExpired
                    ? 'bg-rose-50 border-rose-300 text-rose-900'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-950'
                }`}
              >
                <span className="text-[10px] font-medium block">Expected Return By</span>
                <span className="font-bold text-xs">
                  {new Date(pass.expected_return_time).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  at{' '}
                  {new Date(pass.expected_return_time).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>

            {/* Cryptographic Signature Verification Seal */}
            <div className="pt-2">
              <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">
                  Signed: HMAC-SHA256 • Approved by Hostel 8 Warden ({new Date(pass.approved_at || pass.updated_at).toLocaleTimeString()})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
