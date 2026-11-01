/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GatePass } from '../../types';
import { ParentApprovalPanel } from './ParentApprovalPanel';
import { DecisionModal } from './DecisionModal';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Filter,
  Search,
  Check,
  AlertTriangle,
  QrCode,
  MapPin,
  Calendar,
} from 'lucide-react';

interface ApprovalQueueProps {
  passes: GatePass[];
  onPassUpdated: (updatedPass: GatePass) => void;
  onOpenPreview: (passId: number) => void;
  onOpenSimulator: (passId: number) => void;
  onViewQrPass?: (pass: GatePass) => void;
  selectedFilter: string;
}

export const ApprovalQueue: React.FC<ApprovalQueueProps> = ({
  passes,
  onPassUpdated,
  onOpenPreview,
  onOpenSimulator,
  onViewQrPass,
  selectedFilter,
}) => {
  const [selectedPassForDecision, setSelectedPassForDecision] = useState<GatePass | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter passes based on selected card filter & search term
  const filteredPasses = passes.filter((p) => {
    // Filter logic
    if (selectedFilter === 'AWAITING_PARENT') {
      if (
        p.status !== 'PENDING' ||
        (p.parent_consent_status !== 'AWAITING_RESPONSE' &&
          p.parent_consent_status !== 'MESSAGE_PENDING')
      )
        return false;
    } else if (selectedFilter === 'PARENT_YES') {
      if (p.parent_consent_status !== 'YES') return false;
    } else if (selectedFilter === 'PARENT_NO') {
      if (p.parent_consent_status !== 'NO') return false;
    } else if (selectedFilter === 'AWAITING_WARDEN') {
      if (p.status !== 'PENDING' || p.parent_consent_status !== 'YES') return false;
    } else if (selectedFilter === 'APPROVED') {
      if (p.status !== 'APPROVED') return false;
    } else if (selectedFilter === 'REJECTED') {
      if (p.status !== 'REJECTED') return false;
    }

    // Search term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match =
        p.student_name?.toLowerCase().includes(q) ||
        p.registration_number?.toLowerCase().includes(q) ||
        p.destination?.toLowerCase().includes(q) ||
        p.reason?.toLowerCase().includes(q) ||
        p.parent_name?.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header & Search */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <h3 className="font-extrabold text-slate-900 text-base">
            Student Exit Requests & Approval Queue
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Review destination, initiate parent WhatsApp consent, and record official warden decisions.
          </p>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by student, reg no, destination..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition"
          />
        </div>
      </div>

      {filteredPasses.length === 0 ? (
        <div className="p-12 text-center text-slate-400">
          <Clock className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-semibold text-slate-600">No requests match this filter.</p>
          <p className="text-xs text-slate-400 mt-1">
            New exit requests submitted by students will appear in this queue.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {filteredPasses.map((p) => {
            const isReadyForDecision = p.status === 'PENDING' && p.parent_consent_status === 'YES';
            const isParentNo = p.parent_consent_status === 'NO';

            return (
              <div key={p.id} className="p-5 hover:bg-slate-50/60 transition">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* Left Column: Student Details & Itinerary */}
                  <div className="lg:col-span-5 space-y-2.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">{p.student_name}</h4>
                          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                            {p.registration_number || '2024626'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {p.hostel || 'Hostel 8'}, Room {p.room_number || '204'} • Student:{' '}
                          <span className="font-mono text-slate-700">{p.student_phone || 'N/A'}</span>
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">Pass #{p.id}</span>
                    </div>

                    <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                        <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span>{p.destination}</span>
                      </div>
                      <p className="text-slate-600 pl-5">
                        <span className="font-medium text-slate-700">Reason:</span> {p.reason}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Departure</span>
                        <span className="font-semibold text-slate-800">
                          {new Date(p.departure_time).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          at{' '}
                          {new Date(p.departure_time).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Expected Return</span>
                        <span className="font-semibold text-slate-800">
                          {new Date(p.expected_return_time).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          at{' '}
                          {new Date(p.expected_return_time).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: WhatsApp Parent Consent Management */}
                  <div className="lg:col-span-4">
                    <ParentApprovalPanel
                      pass={p}
                      onPassUpdated={onPassUpdated}
                      onOpenPreview={onOpenPreview}
                      onOpenSimulator={onOpenSimulator}
                    />
                  </div>

                  {/* Right Column: Warden Decision & Pass Status */}
                  <div className="lg:col-span-3 flex flex-col justify-between h-full bg-slate-50/50 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                        Hostel Warden Decision
                      </span>

                      {p.status === 'APPROVED' ? (
                        <div className="space-y-1.5">
                          <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-lg text-xs">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            APPROVED
                          </span>
                          {p.warden_remarks && (
                            <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded border border-slate-200">
                              &quot;{p.warden_remarks}&quot;
                            </p>
                          )}
                          {onViewQrPass && p.signed_token && (
                            <button
                              onClick={() => onViewQrPass(p)}
                              className="mt-1.5 w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 py-1.5 px-3 rounded-lg transition cursor-pointer"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              View Issued QR Pass
                            </button>
                          )}
                        </div>
                      ) : p.status === 'REJECTED' ? (
                        <div className="space-y-1.5">
                          <span className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-800 font-bold px-2.5 py-1 rounded-lg text-xs">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            REJECTED
                          </span>
                          {p.warden_remarks && (
                            <p className="text-[11px] text-rose-900 italic bg-white p-2 rounded border border-rose-200">
                              &quot;{p.warden_remarks}&quot;
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="text-xs">
                            {isReadyForDecision ? (
                              <span className="text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 p-1.5 rounded border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                Parent Approved! Action Required.
                              </span>
                            ) : isParentNo ? (
                              <span className="text-rose-700 font-medium flex items-center gap-1 bg-rose-50 p-1.5 rounded border border-rose-200">
                                <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                Parent Denied. Reject required.
                              </span>
                            ) : (
                              <span className="text-amber-700 font-medium flex items-center gap-1 bg-amber-50 p-1.5 rounded border border-amber-200">
                                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                Awaiting Parent Reply
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => setSelectedPassForDecision(p)}
                            className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer ${
                              isReadyForDecision
                                ? 'bg-purple-700 hover:bg-purple-800 text-white animate-pulse'
                                : 'bg-slate-800 hover:bg-slate-900 text-white'
                            }`}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {isReadyForDecision ? 'Make Approval Decision' : 'Review & Decision'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Decision Modal */}
      {selectedPassForDecision && (
        <DecisionModal
          pass={selectedPassForDecision}
          onClose={() => setSelectedPassForDecision(null)}
          onDecisionCompleted={(updated) => {
            onPassUpdated(updated);
            setSelectedPassForDecision(null);
          }}
        />
      )}
    </div>
  );
};
