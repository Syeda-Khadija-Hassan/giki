/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GatePass } from '../../types';
import {
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ShieldCheck,
  AlertCircle,
  Send,
  CheckCheck,
} from 'lucide-react';

interface ParentConsentStatusProps {
  pass: GatePass;
}

export const ParentConsentStatus: React.FC<ParentConsentStatusProps> = ({ pass }) => {
  // Step completion logic
  // 1: Submitted (always true if pass exists)
  // 2: Parent confirmation requested (parent_message_status in SENT/DELIVERED/READ or parent_consent_status != NOT_REQUESTED)
  // 3: Parent consent received (parent_consent_status == YES or NO)
  // 4: Warden final decision (status == APPROVED or REJECTED)
  // 5: Digital gate pass generated (status == APPROVED && signed_token != null)

  const isStep1Done = true;
  const isStep2Done =
    pass.parent_consent_status !== 'NOT_REQUESTED' ||
    pass.parent_message_status === 'SENT' ||
    pass.parent_message_status === 'DELIVERED' ||
    pass.parent_message_status === 'READ';

  const isStep3Done = pass.parent_consent_status === 'YES' || pass.parent_consent_status === 'NO';
  const isStep3Passed = pass.parent_consent_status === 'YES';
  const isStep3Failed = pass.parent_consent_status === 'NO';

  const isStep4Done = pass.status === 'APPROVED' || pass.status === 'REJECTED';
  const isStep4Approved = pass.status === 'APPROVED';
  const isStep4Rejected = pass.status === 'REJECTED';

  const isStep5Done = isStep4Approved && !!pass.signed_token;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            Mandatory Dual-Approval Progress Tracker
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Both parental WhatsApp consent and hostel warden approval are mandatory.
          </p>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-mono text-slate-400">Pass #{pass.id}</span>
        </div>
      </div>

      {/* Visual Step Tracker */}
      <div className="py-6">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 relative">
          {/* Step 1: Request Submitted */}
          <div
            className={`p-3 rounded-xl border transition ${
              isStep1Done
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center">
                1
              </span>
              <span className="text-xs font-bold">Request Submitted</span>
            </div>
            <p className="text-[11px] text-emerald-800">
              {new Date(pass.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {/* Step 2: Parent WhatsApp Dispatched */}
          <div
            className={`p-3 rounded-xl border transition ${
              isStep2Done
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : pass.status === 'PENDING'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                  isStep2Done ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                }`}
              >
                2
              </span>
              <span className="text-xs font-bold">Parent Notified</span>
            </div>
            <p className="text-[11px]">
              {isStep2Done ? (
                <span className="text-emerald-700 flex items-center gap-1">
                  <CheckCheck className="w-3 h-3" /> Sent to WhatsApp
                </span>
              ) : (
                <span className="text-amber-700 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Awaiting Warden trigger
                </span>
              )}
            </p>
          </div>

          {/* Step 3: Parent WhatsApp Consent */}
          <div
            className={`p-3 rounded-xl border transition ${
              isStep3Passed
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : isStep3Failed
                ? 'bg-rose-50 border-rose-200 text-rose-950'
                : isStep2Done
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                  isStep3Passed
                    ? 'bg-emerald-600 text-white'
                    : isStep3Failed
                    ? 'bg-rose-600 text-white'
                    : isStep2Done
                    ? 'bg-amber-500 text-white animate-pulse'
                    : 'bg-slate-300 text-slate-600'
                }`}
              >
                3
              </span>
              <span className="text-xs font-bold">Parent Consent</span>
            </div>
            <p className="text-[11px]">
              {isStep3Passed ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Reply: YES
                </span>
              ) : isStep3Failed ? (
                <span className="text-rose-700 font-semibold flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> Reply: NO (Denied)
                </span>
              ) : isStep2Done ? (
                <span className="text-amber-700 font-medium">Awaiting Parent reply</span>
              ) : (
                <span className="text-slate-400">Pending initiation</span>
              )}
            </p>
          </div>

          {/* Step 4: Warden Final Decision */}
          <div
            className={`p-3 rounded-xl border transition ${
              isStep4Approved
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : isStep4Rejected
                ? 'bg-rose-50 border-rose-200 text-rose-950'
                : isStep3Passed
                ? 'bg-amber-50 border-amber-200 text-amber-900 animate-pulse'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                  isStep4Approved
                    ? 'bg-emerald-600 text-white'
                    : isStep4Rejected
                    ? 'bg-rose-600 text-white'
                    : isStep3Passed
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-300 text-slate-600'
                }`}
              >
                4
              </span>
              <span className="text-xs font-bold">Warden Decision</span>
            </div>
            <p className="text-[11px]">
              {isStep4Approved ? (
                <span className="text-emerald-700 font-semibold">Approved</span>
              ) : isStep4Rejected ? (
                <span className="text-rose-700 font-semibold">Rejected</span>
              ) : isStep3Passed ? (
                <span className="text-amber-700 font-medium">Ready for Warden review</span>
              ) : (
                <span className="text-slate-400">Awaiting parent consent</span>
              )}
            </p>
          </div>

          {/* Step 5: Signed QR Pass Generated */}
          <div
            className={`p-3 rounded-xl border transition ${
              isStep5Done
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                  isStep5Done ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600'
                }`}
              >
                5
              </span>
              <span className="text-xs font-bold">HMAC Pass Issued</span>
            </div>
            <p className="text-[11px]">
              {isStep5Done ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Valid for Gate Exit
                </span>
              ) : (
                <span className="text-slate-400">Locked until approvals</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-xs">
        {/* Parent Consent Card */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <span className="text-slate-500 font-medium block mb-1">Parent Consent Status</span>
          <div className="flex items-center gap-1.5 font-bold">
            {pass.parent_consent_status === 'YES' && (
              <span className="text-emerald-700 flex items-center gap-1 bg-emerald-100/80 px-2 py-0.5 rounded">
                <CheckCircle2 className="w-3.5 h-3.5" /> YES (Granted)
              </span>
            )}
            {pass.parent_consent_status === 'NO' && (
              <span className="text-rose-700 flex items-center gap-1 bg-rose-100/80 px-2 py-0.5 rounded">
                <XCircle className="w-3.5 h-3.5" /> NO (Denied)
              </span>
            )}
            {pass.parent_consent_status === 'AWAITING_RESPONSE' && (
              <span className="text-amber-700 flex items-center gap-1 bg-amber-100/80 px-2 py-0.5 rounded">
                <Clock className="w-3.5 h-3.5" /> Awaiting Parent Reply
              </span>
            )}
            {pass.parent_consent_status === 'NOT_REQUESTED' && (
              <span className="text-slate-600 flex items-center gap-1 bg-slate-200/80 px-2 py-0.5 rounded">
                Not Requested Yet
              </span>
            )}
            {pass.parent_consent_status === 'DELIVERY_FAILED' && (
              <span className="text-rose-700 flex items-center gap-1 bg-rose-100/80 px-2 py-0.5 rounded">
                <AlertCircle className="w-3.5 h-3.5" /> Delivery Failed
              </span>
            )}
          </div>
          {pass.parent_response_at && (
            <p className="text-[11px] text-slate-400 mt-1">
              Received: {new Date(pass.parent_response_at).toLocaleString()}
            </p>
          )}
        </div>

        {/* WhatsApp Message Delivery Status */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <span className="text-slate-500 font-medium block mb-1">WhatsApp Delivery Status</span>
          <div className="flex items-center gap-1.5 font-bold">
            <span
              className={`px-2 py-0.5 rounded text-[11px] uppercase tracking-wider ${
                pass.parent_message_status === 'SENT' || pass.parent_message_status === 'DELIVERED'
                  ? 'bg-blue-100 text-blue-800'
                  : pass.parent_message_status === 'READ'
                  ? 'bg-emerald-100 text-emerald-800'
                  : pass.parent_message_status === 'FAILED'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {pass.parent_message_status}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Guardian: {pass.parent_name || 'N/A'} ({pass.parent_phone_masked || 'Masked'})
          </p>
        </div>

        {/* Warden Remarks & Status */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <span className="text-slate-500 font-medium block mb-1">Hostel Warden Decision</span>
          <div className="flex items-center gap-1.5 font-bold">
            {pass.status === 'APPROVED' && (
              <span className="text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                APPROVED
              </span>
            )}
            {pass.status === 'REJECTED' && (
              <span className="text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded">
                REJECTED
              </span>
            )}
            {pass.status === 'PENDING' && (
              <span className="text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded">
                PENDING WARDEN REVIEW
              </span>
            )}
          </div>
          {pass.warden_remarks ? (
            <p className="text-[11px] text-slate-600 mt-1 italic">
              &quot;{pass.warden_remarks}&quot;
            </p>
          ) : (
            <p className="text-[11px] text-slate-400 mt-1">Remarks pending</p>
          )}
        </div>
      </div>
    </div>
  );
};
