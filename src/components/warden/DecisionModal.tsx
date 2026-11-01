/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GatePass } from '../../types';
import { api } from '../../services/api';
import {
  ShieldCheck,
  XCircle,
  AlertTriangle,
  CheckCircle2,
  Lock,
  MessageSquare,
  X,
} from 'lucide-react';

interface DecisionModalProps {
  pass: GatePass;
  onClose: () => void;
  onDecisionCompleted: (updatedPass: GatePass) => void;
}

export const DecisionModal: React.FC<DecisionModalProps> = ({
  pass,
  onClose,
  onDecisionCompleted,
}) => {
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED'>(
    pass.parent_consent_status === 'YES' ? 'APPROVED' : 'REJECTED'
  );
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isParentYes = pass.parent_consent_status === 'YES';
  const isParentNo = pass.parent_consent_status === 'NO';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!remarks.trim() || remarks.trim().length < 2) {
      setError('Hostel warden remarks are mandatory for all official approval/rejection decisions.');
      return;
    }

    if (decision === 'APPROVED' && !isParentYes) {
      setError('Cannot approve: Mandatory parental WhatsApp consent has not been granted (status is not YES).');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await api.makeWardenDecision(pass.id, {
        decision,
        remarks: remarks.trim(),
      });
      onDecisionCompleted(updated);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit warden decision.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            <h3 className="font-extrabold text-base tracking-tight">
              Hostel Warden Final Decision
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Student and Request Summary */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between font-bold text-slate-800">
              <span>{pass.student_name}</span>
              <span className="font-mono">{pass.registration_number || '2024626'}</span>
            </div>
            <p className="text-slate-600">
              <span className="font-semibold text-slate-700">Destination:</span> {pass.destination}
            </p>
            <p className="text-slate-500">
              <span className="font-semibold text-slate-700">Reason:</span> {pass.reason}
            </p>
          </div>

          {/* Precondition Notice Box */}
          <div
            className={`p-3.5 rounded-xl border text-xs ${
              isParentYes
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : isParentNo
                ? 'bg-rose-50 border-rose-200 text-rose-950'
                : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}
          >
            {isParentYes && (
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Parent has granted permission. Final warden decision required.</span>
              </div>
            )}
            {isParentNo && (
              <div className="flex items-center gap-2 font-bold">
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Parent/Guardian denied permission. This request cannot be approved.</span>
              </div>
            )}
            {!isParentYes && !isParentNo && (
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Awaiting parent/guardian confirmation. Approval is locked until consent.</span>
              </div>
            )}
          </div>

          {/* Decision Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Select Official Action
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={!isParentYes}
                onClick={() => setDecision('APPROVED')}
                className={`py-3 px-4 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  decision === 'APPROVED'
                    ? 'bg-emerald-700 text-white border-emerald-800 ring-2 ring-emerald-500/30'
                    : 'bg-white text-emerald-800 border-slate-200 hover:bg-emerald-50'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {!isParentYes ? <Lock className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                APPROVE PASS
              </button>

              <button
                type="button"
                onClick={() => setDecision('REJECTED')}
                className={`py-3 px-4 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  decision === 'REJECTED'
                    ? 'bg-rose-700 text-white border-rose-800 ring-2 ring-rose-500/30'
                    : 'bg-white text-rose-800 border-slate-200 hover:bg-rose-50'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                REJECT PASS
              </button>
            </div>
            {!isParentYes && (
              <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Approval button is disabled because parent consent is not YES.
              </p>
            )}
          </div>

          {/* Mandatory Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Warden Official Remarks <span className="text-rose-500">* (Mandatory)</span>
            </label>
            <div className="relative">
              <textarea
                required
                rows={3}
                placeholder={
                  decision === 'APPROVED'
                    ? 'e.g. Parental consent verified via WhatsApp. Exit permitted as per university hostel guidelines.'
                    : 'e.g. Request denied due to impending examination week / curfew restrictions.'
                }
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (decision === 'APPROVED' && !isParentYes)}
              className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
                decision === 'APPROVED'
                  ? 'bg-emerald-700 hover:bg-emerald-800'
                  : 'bg-rose-700 hover:bg-rose-800'
              }`}
            >
              {isSubmitting ? 'Recording Decision...' : `Confirm ${decision} Decision`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
