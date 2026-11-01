/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { ShieldAlert, Lock, ArrowLeft, LogOut, CheckCircle2 } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  onNavigateToAuthorized?: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  children,
  onNavigateToAuthorized,
}) => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Authentication Required</h2>
        <p className="text-xs text-slate-500">
          You must be signed in with an authorized GIKI institutional account to access this system.
        </p>
      </div>
    );
  }

  // Role validation check
  const hasAccess = allowedRoles.includes(user.role);

  if (!hasAccess) {
    const requiredRolesStr = allowedRoles
      .map((r) => (r === 'STUDENT' ? 'Student' : r === 'WARDEN' ? 'Hostel Warden' : 'Gate Security'))
      .join(' or ');

    return (
      <div className="max-w-lg mx-auto my-12 p-6 sm:p-8 bg-white rounded-3xl border-2 border-rose-200 shadow-md text-center space-y-5 animate-in fade-in">
        <div className="w-14 h-14 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center mx-auto ring-4 ring-rose-500/10">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] font-mono font-bold tracking-widest text-rose-700 uppercase bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
            403 Forbidden • Access Denied
          </span>
          <h2 className="text-lg font-extrabold text-slate-900">
            Unauthorized Portal Access Attempt
          </h2>
          <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
            You are authenticated as{' '}
            <span className="font-bold text-slate-900">
              {user.role} ({user.email})
            </span>
            . This section requires <span className="font-bold text-slate-900">{requiredRolesStr}</span> authorization.
          </p>
        </div>

        {/* Security Policy Explanation Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-xs space-y-1.5 text-slate-600">
          <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wide">
            Institutional Role-Based Access Control (RBAC) Policy:
          </span>
          {user.role === 'STUDENT' ? (
            <p className="text-[11px] leading-relaxed">
              • Students cannot view or access the <strong>Warden Administration Queue</strong> or make approval decisions.
              <br />
              • Students cannot access the <strong>Gate Checkpoint Terminal</strong>.
              <br />
              • All student actions are restricted to submitting personal leave requests and viewing issued passes.
            </p>
          ) : (
            <p className="text-[11px] leading-relaxed">
              • Wardens and administrative staff manage exit approvals and parent consent verification.
              <br />
              • Student exit submission forms are reserved strictly for registered student accounts.
            </p>
          )}
        </div>

        {/* Remediation Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {onNavigateToAuthorized && (
            <button
              onClick={onNavigateToAuthorized}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Go to My Authorized Portal
            </button>
          )}
          <button
            onClick={logout}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Switch Account
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
