/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GatePass } from '../../types';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  AlertOctagon,
  UserCheck,
} from 'lucide-react';

interface WardenSummaryCardsProps {
  passes: GatePass[];
  selectedFilter: string;
  onSelectFilter: (filter: string) => void;
}

export const WardenSummaryCards: React.FC<WardenSummaryCardsProps> = ({
  passes,
  selectedFilter,
  onSelectFilter,
}) => {
  const total = passes.length;
  const awaitingParent = passes.filter(
    (p) =>
      p.status === 'PENDING' &&
      (p.parent_consent_status === 'AWAITING_RESPONSE' ||
        p.parent_consent_status === 'MESSAGE_PENDING')
  ).length;

  const parentApproved = passes.filter((p) => p.parent_consent_status === 'YES').length;
  const parentDenied = passes.filter((p) => p.parent_consent_status === 'NO').length;

  const awaitingWarden = passes.filter(
    (p) => p.status === 'PENDING' && p.parent_consent_status === 'YES'
  ).length;

  const finalApproved = passes.filter((p) => p.status === 'APPROVED').length;
  const finalRejected = passes.filter((p) => p.status === 'REJECTED').length;

  const cards = [
    {
      id: 'ALL',
      title: 'Total Requests',
      count: total,
      icon: FileText,
      color: 'text-slate-700 bg-slate-100 border-slate-200',
    },
    {
      id: 'AWAITING_PARENT',
      title: 'Awaiting Parent',
      count: awaitingParent,
      icon: Clock,
      color: 'text-amber-700 bg-amber-50 border-amber-200',
    },
    {
      id: 'PARENT_YES',
      title: 'Parent Approved',
      count: parentApproved,
      icon: CheckCircle2,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
    {
      id: 'PARENT_NO',
      title: 'Parent Denied',
      count: parentDenied,
      icon: XCircle,
      color: 'text-rose-700 bg-rose-50 border-rose-200',
    },
    {
      id: 'AWAITING_WARDEN',
      title: 'Ready for Warden',
      count: awaitingWarden,
      icon: UserCheck,
      color: 'text-purple-700 bg-purple-50 border-purple-200 ring-2 ring-purple-400/30',
    },
    {
      id: 'APPROVED',
      title: 'Final Approved',
      count: finalApproved,
      icon: ShieldCheck,
      color: 'text-emerald-800 bg-emerald-100/70 border-emerald-300',
    },
    {
      id: 'REJECTED',
      title: 'Final Rejected',
      count: finalRejected,
      icon: AlertOctagon,
      color: 'text-rose-800 bg-rose-100/70 border-rose-300',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      {cards.map((c) => {
        const Icon = c.icon;
        const isSelected = selectedFilter === c.id;
        return (
          <button
            key={c.id}
            onClick={() => onSelectFilter(c.id)}
            className={`p-3 rounded-2xl border text-left transition relative cursor-pointer ${
              c.color
            } ${isSelected ? 'ring-2 ring-slate-900 shadow-sm' : 'hover:scale-[1.02]'}`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold tracking-tight truncate">{c.title}</span>
              <Icon className="w-3.5 h-3.5 opacity-80" />
            </div>
            <div className="text-xl font-extrabold tracking-tight">{c.count}</div>
          </button>
        );
      })}
    </div>
  );
};
