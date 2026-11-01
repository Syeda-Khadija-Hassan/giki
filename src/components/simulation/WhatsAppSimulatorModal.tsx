/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { whatsappService } from '../../services/whatsapp';
import { WhatsAppPreview } from '../../types';
import {
  Smartphone,
  X,
  Send,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';

interface WhatsAppSimulatorModalProps {
  passId: number;
  onClose: () => void;
  onSimulationCompleted: () => void;
}

export const WhatsAppSimulatorModal: React.FC<WhatsAppSimulatorModalProps> = ({
  passId,
  onClose,
  onSimulationCompleted,
}) => {
  const [preview, setPreview] = useState<WhatsAppPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [customReply, setCustomReply] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const data = await whatsappService.getPreview(passId);
        setPreview(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPreview();
  }, [passId]);

  const handleSimulate = async (reply: string) => {
    setIsSubmitting(true);
    setActionMessage(null);
    try {
      const res = await whatsappService.simulateReply(passId, reply);
      setActionMessage(res.message);
      onSimulationCompleted();
    } catch (err: any) {
      setActionMessage(err?.message || 'Simulation error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Banner */}
        <div className="bg-emerald-700 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            <div>
              <h3 className="font-bold text-sm">Parent WhatsApp Simulator</h3>
              <span className="text-[10px] bg-emerald-800 text-emerald-200 px-1.5 py-0.5 rounded font-mono uppercase">
                Development Simulation Mode
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Development Notice */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-[11px] text-amber-900 flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Development Mode: Simulates inbound Meta webhook reply from registered guardian.
          </span>
        </div>

        {/* Phone Chat Body */}
        <div className="p-4 bg-slate-100 flex-1 overflow-y-auto space-y-3 font-sans">
          {loading ? (
            <div className="text-center py-8 text-xs text-slate-500">
              Loading WhatsApp message preview...
            </div>
          ) : preview ? (
            <>
              {/* Guardian Info Pill */}
              <div className="text-center">
                <span className="text-[10px] font-semibold bg-white/80 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-full shadow-2xs">
                  Chatting with: {preview.recipient_name} ({preview.recipient_phone_masked})
                </span>
              </div>

              {/* Incoming WhatsApp Message Bubble from GIKI */}
              <div className="bg-white rounded-2xl rounded-tl-xs p-3.5 shadow-xs border border-slate-200 text-xs text-slate-800 space-y-2 max-w-[90%]">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800 border-b border-slate-100 pb-1.5 text-[11px]">
                  <span>GIKI FOR WOMEN — PARENT CONSENT REQUEST</span>
                </div>
                <div className="whitespace-pre-line text-[11px] leading-relaxed text-slate-700">
                  {preview.message_body}
                </div>
                <div className="text-[9px] text-slate-400 text-right">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Delivered
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-6 text-xs text-slate-500">
              Pass information not found.
            </div>
          )}

          {actionMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-medium animate-in fade-in">
              {actionMessage}
            </div>
          )}
        </div>

        {/* Simulation Action Bar */}
        <div className="p-4 bg-white border-t border-slate-200 space-y-3">
          <span className="text-xs font-bold text-slate-700 block">
            Simulate Parent Guardian Response:
          </span>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleSimulate('YES')}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              Reply &quot;YES&quot; (Grant Consent)
            </button>

            <button
              onClick={() => handleSimulate('NO')}
              disabled={isSubmitting}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Reply &quot;NO&quot; (Deny Consent)
            </button>
          </div>

          {/* Custom Reply Option */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Test custom response (e.g. Call me)"
              value={customReply}
              onChange={(e) => setCustomReply(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              onClick={() => {
                if (customReply.trim()) {
                  handleSimulate(customReply.trim());
                  setCustomReply('');
                }
              }}
              disabled={isSubmitting || !customReply.trim()}
              className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
