/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RotateCw,
  X,
  Sparkles,
  Check,
  AlertTriangle,
} from 'lucide-react';

interface SystemTestSuiteModalProps {
  onClose: () => void;
}

export const SystemTestSuiteModal: React.FC<SystemTestSuiteModalProps> = ({ onClose }) => {
  const [loading, setLoading] = useState(true);
  const [suiteData, setSuiteData] = useState<any | null>(null);

  const runTests = async () => {
    setLoading(true);
    try {
      const data = await api.runTestSuite();
      setSuiteData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <div>
              <h3 className="font-extrabold text-base tracking-tight">
                GIKI for Women Security & Workflow Test Suite
              </h3>
              <p className="text-xs text-slate-400">
                Automated validation of Section 14 requirements & cryptographic guarantees.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metric Summary */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="text-slate-600">
              Total Tests: <strong className="text-slate-900">{suiteData?.total_tests || 0}</strong>
            </span>
            <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Passed: {suiteData?.passed_tests || 0}
            </span>
            {suiteData?.failed_tests > 0 && (
              <span className="text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                Failed: {suiteData?.failed_tests}
              </span>
            )}
          </div>
          <button
            onClick={runTests}
            disabled={loading}
            className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Re-run Tests
          </button>
        </div>

        {/* Test List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 bg-white">
          {loading ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              <RotateCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
              Executing automated security assertions and workflow checks...
            </div>
          ) : suiteData?.results ? (
            suiteData.results.map((res: any, idx: number) => (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl border transition flex items-start gap-3 text-xs ${
                  res.passed
                    ? 'bg-emerald-50/40 border-emerald-200 text-slate-800'
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}
              >
                {res.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">{res.name}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      {res.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    {res.message}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-xs text-slate-400">No test data available.</div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
