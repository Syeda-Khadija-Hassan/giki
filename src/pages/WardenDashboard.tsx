/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { GatePass, WhatsAppPreview } from '../types';
import { whatsappService } from '../services/whatsapp';
import { WardenSummaryCards } from '../components/warden/WardenSummaryCards';
import { ApprovalQueue } from '../components/warden/ApprovalQueue';
import { ActivePassQR } from '../components/student/ActivePassQR';
import {
  Shield,
  RefreshCw,
  Eye,
  X,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  QrCode,
} from 'lucide-react';

interface WardenDashboardProps {
  onOpenSimulator: (passId: number) => void;
}

export const WardenDashboard: React.FC<WardenDashboardProps> = ({ onOpenSimulator }) => {
  const { user } = useAuth();
  const [passes, setPasses] = useState<GatePass[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  // Preview Message Modal state
  const [previewData, setPreviewData] = useState<WhatsAppPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // View QR Pass Modal state
  const [viewingPass, setViewingPass] = useState<GatePass | null>(null);

  const fetchPasses = async () => {
    setLoading(true);
    try {
      const data = await api.getWardenPasses();
      setPasses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPasses();
  }, []);

  const handlePassUpdated = (updatedPass: GatePass) => {
    setPasses((prev) => prev.map((p) => (p.id === updatedPass.id ? updatedPass : p)));
  };

  const handleOpenPreview = async (passId: number) => {
    setPreviewLoading(true);
    try {
      const data = await whatsappService.getPreview(passId);
      setPreviewData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Warden Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-900 text-white flex items-center justify-center font-extrabold text-xl shadow-xs ring-4 ring-purple-500/10">
            <Shield className="w-7 h-7 text-purple-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Hostel Warden Administration Portal
              </h1>
              <span className="text-xs font-mono font-bold bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-md">
                Hostel 8 Chief Warden
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Review female student exit requests • WhatsApp parent consent dispatch • Final signed pass issuance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            onClick={fetchPasses}
            className="p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition cursor-pointer flex items-center gap-2 text-xs font-semibold"
            title="Refresh queue"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <WardenSummaryCards
        passes={passes}
        selectedFilter={selectedFilter}
        onSelectFilter={setSelectedFilter}
      />

      {/* Main Approval Queue */}
      <ApprovalQueue
        passes={passes}
        onPassUpdated={handlePassUpdated}
        onOpenPreview={handleOpenPreview}
        onOpenSimulator={onOpenSimulator}
        onViewQrPass={(p) => setViewingPass(p)}
        selectedFilter={selectedFilter}
      />

      {/* Outbound WhatsApp Preview Modal */}
      {previewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-emerald-800 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-300" />
                <h3 className="font-extrabold text-sm">Meta WhatsApp Cloud Message Preview</h3>
              </div>
              <button
                onClick={() => setPreviewData(null)}
                className="text-emerald-200 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Recipient Guardian</span>
                    <span className="font-bold text-slate-800">{previewData.recipient_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">WhatsApp Number</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {previewData.recipient_phone_masked}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Outbound WhatsApp Text Body
                </span>
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4 font-mono text-[11px] text-emerald-950 whitespace-pre-line leading-relaxed shadow-inner">
                  {previewData.message_body}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setPreviewData(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Viewing QR Pass Modal */}
      {viewingPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-sm">Issued Digital Gate Pass Record</h3>
              </div>
              <button
                onClick={() => setViewingPass(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <ActivePassQR pass={viewingPass} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
