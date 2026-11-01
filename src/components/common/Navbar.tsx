/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  Shield,
  Building2,
  LogOut,
  QrCode,
  Smartphone,
  CheckCircle2,
  UserCheck,
  Lock,
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'student' | 'warden' | 'gate';
  onSelectTab: (tab: 'student' | 'warden' | 'gate') => void;
  onOpenWhatsAppSimulator?: () => void;
  onOpenTestSuite?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenWhatsAppSimulator,
  onOpenTestSuite,
}) => {
  const { user, logout, switchDemoAccount, isAuthenticated } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Crest */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-900 flex items-center justify-center text-white shadow-sm ring-1 ring-emerald-900/10">
              <GraduationCap className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-lg">
                  GIKI FOR WOMEN
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
                  Exit Assistance
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Parent WhatsApp Consent & Warden Approval System
              </p>
            </div>
          </div>

          {/* Role-Specific Navigation: ONLY show tabs permitted for the authenticated user's role! */}
          {isAuthenticated && user && (
            <nav className="hidden md:flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              {user.role === 'STUDENT' && (
                <button
                  onClick={() => onSelectTab('student')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition bg-white text-emerald-800 shadow-xs ring-1 ring-emerald-500/20"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                  Student Portal (Authorized)
                </button>
              )}

              {user.role === 'WARDEN' && (
                <button
                  onClick={() => onSelectTab('warden')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition bg-white text-purple-800 shadow-xs ring-1 ring-purple-500/20"
                >
                  <Shield className="w-3.5 h-3.5 text-purple-600" />
                  Warden Approval Queue (Authorized)
                </button>
              )}

              {user.role === 'SECURITY' && (
                <button
                  onClick={() => onSelectTab('gate')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition bg-white text-blue-800 shadow-xs ring-1 ring-blue-500/20"
                >
                  <QrCode className="w-3.5 h-3.5 text-blue-600" />
                  Gate Checkpoint Terminal (Authorized)
                </button>
              )}
            </nav>
          )}

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Demo Switcher (Simulates Authentic Login with Real Credentials & Fresh Token) */}
            <div className="hidden lg:flex items-center gap-1 text-xs border border-slate-200 bg-slate-50 px-2 py-1 rounded-lg">
              <span className="text-slate-400 font-medium mr-1 text-[11px]">Authenticate as:</span>
              <button
                onClick={async () => {
                  await switchDemoAccount('STUDENT');
                  onSelectTab('student');
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                  user?.role === 'STUDENT'
                    ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
                title="Authenticate as Student: Syeda Khadija Hassan"
              >
                Student
              </button>
              <button
                onClick={async () => {
                  await switchDemoAccount('WARDEN');
                  onSelectTab('warden');
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                  user?.role === 'WARDEN'
                    ? 'bg-purple-600 text-white font-semibold shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
                title="Authenticate as Warden: Hostel 8 Chief Warden"
              >
                Warden
              </button>
              <button
                onClick={async () => {
                  await switchDemoAccount('SECURITY');
                  onSelectTab('gate');
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                  user?.role === 'SECURITY'
                    ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
                title="Authenticate as Main Gate Security Officer"
              >
                Security
              </button>
            </div>

            {/* WhatsApp Simulator trigger */}
            {onOpenWhatsAppSimulator && (
              <button
                onClick={onOpenWhatsAppSimulator}
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                title="Open WhatsApp Parent Interactive Simulator"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Parent WhatsApp</span>
              </button>
            )}

            {/* User Profile Pill & Logout */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-800 leading-tight">
                    {user.full_name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {user.role === 'STUDENT'
                      ? `Student • Reg: ${user.registration_number || '2024626'}`
                      : user.role === 'WARDEN'
                      ? 'Warden • Hostel 8 Admin'
                      : 'Security • Main Campus Gate'}
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  title="Sign out of current account"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Mobile Navigation Tabs (Strictly Role-Authorized) */}
        {isAuthenticated && user && (
          <div className="flex md:hidden items-center justify-between py-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-500">
              Active Session:{' '}
              <strong className="text-slate-800">
                {user.role === 'STUDENT' ? 'Student' : user.role === 'WARDEN' ? 'Warden' : 'Gate Guard'}
              </strong>
            </span>
            <button
              onClick={logout}
              className="text-xs font-semibold text-rose-600 flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
