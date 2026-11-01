/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { GatePass } from '../types';
import { ExitPassForm } from '../components/student/ExitPassForm';
import { ActivePassQR } from '../components/student/ActivePassQR';
import { ParentConsentStatus } from '../components/student/ParentConsentStatus';
import {
  GraduationCap,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Calendar,
  MapPin,
  RefreshCw,
  QrCode,
  Smartphone,
  Eye,
} from 'lucide-react';

interface StudentDashboardProps {
  onOpenSimulator: (passId: number) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onOpenSimulator }) => {
  const { user } = useAuth();
  const [passes, setPasses] = useState<GatePass[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'new_request' | 'history'>('overview');
  const [selectedPass, setSelectedPass] = useState<GatePass | null>(null);

  const fetchMyPasses = async () => {
    setLoading(true);
    try {
      const data = await api.getMyPasses();
      setPasses(data);
      if (data.length > 0) {
        // Prioritize approved or pending pass
        const approved = data.find((p) => p.status === 'APPROVED');
        const pending = data.find((p) => p.status === 'PENDING');
        setSelectedPass(approved || pending || data[0]);
      }
    } catch (err) {
      console.error('Failed to load passes', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPasses();
  }, []);

  const handlePassCreated = (newPass: GatePass) => {
    setPasses((prev) => [newPass, ...prev]);
    setSelectedPass(newPass);
    setActiveTab('overview');
  };

  const latestApprovedPass = passes.find((p) => p.status === 'APPROVED');
  const latestPendingPass = passes.find((p) => p.status === 'PENDING');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Student Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-800 text-white flex items-center justify-center font-extrabold text-xl shadow-xs ring-4 ring-emerald-500/10">
              {user?.full_name ? user.full_name[0] : 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  {user?.full_name}
                </h1>
                <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md">
                  Reg: {user?.registration_number || '2024626'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {user?.hostel || 'Hostel 8'}, Room {user?.room_number || '204'} • Student Phone:{' '}
                <span className="font-mono text-slate-700">{user?.student_phone || '+923001234567'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            {/* Registered Guardian Info Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                Registered Parent / Guardian
              </span>
              <div className="font-bold text-slate-800">{user?.parent_name || 'Registered Parent'}</div>
              <div className="text-[11px] font-mono text-emerald-700 font-medium">
                WhatsApp: {user?.parent_phone_masked || '+92 300 •••• 543'}
              </div>
            </div>

            <button
              onClick={fetchMyPasses}
              className="p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition cursor-pointer"
              title="Refresh requests"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Current Status & Digital Pass
          </button>

          <button
            onClick={() => setActiveTab('new_request')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'new_request'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Submit New Exit Request
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Request History ({passes.length})
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Active Approved QR Pass if any */}
          {latestApprovedPass && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-emerald-900 tracking-wider uppercase">
                  Active Approved Digital Gate Pass
                </span>
                <span className="text-xs font-semibold text-emerald-700">
                  Ready for scanning at Main Gate Checkpoint
                </span>
              </div>
              <ActivePassQR pass={latestApprovedPass} />
            </div>
          )}

          {/* Progress Tracker for Latest Pass */}
          {selectedPass ? (
            <div className="space-y-3">
              <ParentConsentStatus pass={selectedPass} />

              {/* Quick simulation helper for students testing parent response */}
              {selectedPass.status === 'PENDING' && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-emerald-950 block">
                      Testing WhatsApp Parent Consent?
                    </span>
                    <p className="text-emerald-800 text-[11px] mt-0.5">
                      You can simulate the parent replying YES or NO to test how the workflow updates in real-time.
                    </p>
                  </div>
                  <button
                    onClick={() => onOpenSimulator(selectedPass.id)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition shrink-0 cursor-pointer flex items-center gap-1.5"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    Open Parent WhatsApp Simulator
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
              <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="font-bold text-slate-700 text-sm">No Active Exit Requests</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                You currently do not have any pending or active exit passes.
              </p>
              <button
                onClick={() => setActiveTab('new_request')}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
              >
                Create First Exit Request
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'new_request' && (
        <div className="max-w-2xl mx-auto">
          <ExitPassForm onSuccess={handlePassCreated} />
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Your Exit Request History</h3>
            <span className="text-xs text-slate-400 font-mono">{passes.length} Requests Total</span>
          </div>

          {passes.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No requests submitted yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {passes.map((p) => (
                <div key={p.id} className="p-4 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{p.destination}</span>
                      <span className="font-mono text-[10px] text-slate-400">Pass #{p.id}</span>
                    </div>
                    <p className="text-slate-500">Reason: {p.reason}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span>Dep: {new Date(p.departure_time).toLocaleString()}</span>
                      <span>•</span>
                      <span>Ret: {new Date(p.expected_return_time).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="text-right">
                      {p.status === 'APPROVED' && (
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full text-[11px]">
                          APPROVED
                        </span>
                      )}
                      {p.status === 'REJECTED' && (
                        <span className="bg-rose-100 text-rose-800 font-bold px-2.5 py-1 rounded-full text-[11px]">
                          REJECTED
                        </span>
                      )}
                      {p.status === 'PENDING' && (
                        <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-full text-[11px]">
                          PENDING
                        </span>
                      )}
                      <span className="block text-[10px] text-slate-400 mt-1">
                        Parent: {p.parent_consent_status}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedPass(p);
                        setActiveTab('overview');
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition cursor-pointer"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
