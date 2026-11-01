/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GatePass } from '../../types';
import { whatsappService } from '../../services/whatsapp';
import {
  Smartphone,
  Send,
  RotateCw,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  AlertTriangle,
  CheckCheck,
} from 'lucide-react';

interface ParentApprovalPanelProps {
  pass: GatePass;
  onPassUpdated: (updatedPass: GatePass) => void;
  onOpenPreview: (passId: number) => void;
  onOpenSimulator: (passId: number) => void;
}

export const ParentApprovalPanel: React.FC<ParentApprovalPanelProps> = ({
  pass,
  onPassUpdated,
  onOpenPreview,
  onOpenSimulator,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendConsent = async () => {
    setLoading(true);
    setError(null);
    try {
      const updated = await whatsappService.requestParentConsent(pass.id);
      onPassUpdated(updated);
    } catch (err: any) {
      setError(err?.message || 'Failed to dispatch WhatsApp message');
    } finally {
      setLoading(false);
    }
  };

  const handleResendConsent = async () => {
    setLoading(true);
    setError(null);
    try {
      const updated = await whatsappService.resendParentConsent(pass.id);
      onPassUpdated(updated);
    } catch (err: any) {
      setError(err?.message || 'Failed to resend WhatsApp message');
    } finally {
      setLoading(false);
    }
  };

  const canRequest = pass.status === 'PENDING' && pass.parent_consent_status === 'NOT_REQUESTED';
  const canResend =
    pass.status === 'PENDING' &&
    (pass.parent_consent_status === 'AWAITING_RESPONSE' ||
      pass.parent_consent_status === 'DELIVERY_FAILED');

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-2.5">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold text-slate-800">
          <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
          <span>Parent WhatsApp Verification</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onOpenPreview(pass.id)}
            className="text-[11px] font-medium text-slate-600 hover:text-emerald-700 bg-white hover:bg-slate-100 border border-slate-200 px-2 py-0.5 rounded transition flex items-center gap-1 cursor-pointer"
            title="Inspect formatted Meta WhatsApp message"
          >
            <Eye className="w-3 h-3" />
            Preview Message
          </button>
        </div>
      </div>

      {error && (
        <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Guardian Contact Info */}
      <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2 rounded-lg border border-slate-100">
        <div>
          <span className="text-slate-400 block font-medium">Guardian Name</span>
          <span className="font-semibold text-slate-800 truncate block">
            {pass.parent_name || 'Guardian'}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block font-medium">WhatsApp Number</span>
          <span className="font-mono font-semibold text-slate-800">
            {pass.parent_phone_masked || '+92 300 •••• 543'}
          </span>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Consent Badge */}
        <div className="flex items-center gap-1">
          <span className="text-slate-500 font-medium text-[11px]">Parent Consent:</span>
          {pass.parent_consent_status === 'YES' && (
            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[11px]">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              YES (Granted)
            </span>
          )}
          {pass.parent_consent_status === 'NO' && (
            <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded text-[11px]">
              <XCircle className="w-3 h-3 text-rose-600" />
              NO (Denied)
            </span>
          )}
          {pass.parent_consent_status === 'AWAITING_RESPONSE' && (
            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded text-[11px] animate-pulse">
              <Clock className="w-3 h-3 text-amber-600" />
              Awaiting Reply
            </span>
          )}
          {pass.parent_consent_status === 'NOT_REQUESTED' && (
            <span className="inline-flex items-center gap-1 bg-slate-200 text-slate-700 font-medium px-2 py-0.5 rounded text-[11px]">
              Not Dispatched
            </span>
          )}
          {pass.parent_consent_status === 'DELIVERY_FAILED' && (
            <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded text-[11px]">
              Delivery Failed
            </span>
          )}
        </div>

        {/* WhatsApp Delivery Badge */}
        <div className="flex items-center gap-1">
          <span className="text-slate-500 font-medium text-[11px]">Meta API:</span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
              pass.parent_message_status === 'SENT' || pass.parent_message_status === 'DELIVERED'
                ? 'bg-blue-100 text-blue-800'
                : pass.parent_message_status === 'READ'
                ? 'bg-emerald-100 text-emerald-800'
                : pass.parent_message_status === 'FAILED'
                ? 'bg-rose-100 text-rose-800'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {pass.parent_message_status}
          </span>
        </div>
      </div>

      {pass.parent_response_at && (
        <p className="text-[10px] text-slate-400">
          Response recorded: {new Date(pass.parent_response_at).toLocaleString()}
        </p>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60">
        {canRequest && (
          <button
            onClick={handleSendConsent}
            disabled={loading}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-lg text-xs shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            {loading ? 'Sending WhatsApp...' : 'Request Parent Approval'}
          </button>
        )}

        {canResend && (
          <button
            onClick={handleResendConsent}
            disabled={loading}
            className="inline-flex items-center gap-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Resend / Retry
          </button>
        )}

        {/* Simulation Shortcut for rapid testing */}
        {pass.status === 'PENDING' && (
          <button
            onClick={() => onOpenSimulator(pass.id)}
            className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 font-medium px-2 py-1 rounded transition ml-auto cursor-pointer"
            title="Simulate WhatsApp Parent reply YES / NO directly"
          >
            <Smartphone className="w-3 h-3" />
            Simulate Reply
          </button>
        )}
      </div>
    </div>
  );
};
