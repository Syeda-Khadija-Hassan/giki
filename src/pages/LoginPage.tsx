/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  Shield,
  Lock,
  Mail,
  UserCheck,
  AlertCircle,
  QrCode,
  ArrowRight,
} from 'lucide-react';

interface LoginPageProps {
  onNavigateToRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigateToRegister }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('u2024626@giki.edu.pk');
  const [password, setPassword] = useState('student123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setError(err?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (role: 'student' | 'warden' | 'security') => {
    setError(null);
    if (role === 'student') {
      setEmail('u2024626@giki.edu.pk');
      setPassword('student123');
    } else if (role === 'warden') {
      setEmail('warden@giki.edu.pk');
      setPassword('warden123');
    } else if (role === 'security') {
      setEmail('security@giki.edu.pk');
      setPassword('security123');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-900 mx-auto flex items-center justify-center text-white shadow-md ring-4 ring-emerald-500/10">
            <GraduationCap className="w-8 h-8 text-emerald-300" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            GIKI FOR WOMEN
          </h1>
          <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
            Digital Exit Assistance with Mandatory Parent WhatsApp Consent & Hostel Warden Approval
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 mb-1">Sign In to Your Account</h2>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Institutional Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="u2024626@giki.edu.pk or warden@giki.edu.pk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Students must use institutional format: u202xxxx@giki.edu.pk
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
              Demonstration Accounts (Click to autofill)
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDemoCredentials('student')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-center transition cursor-pointer text-xs"
              >
                <GraduationCap className="w-3.5 h-3.5 text-emerald-700 mx-auto mb-1" />
                <span className="font-bold text-slate-800 block text-[11px]">Student</span>
                <span className="text-[9px] text-slate-400 font-mono">2024626</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('warden')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 text-center transition cursor-pointer text-xs"
              >
                <Shield className="w-3.5 h-3.5 text-purple-700 mx-auto mb-1" />
                <span className="font-bold text-slate-800 block text-[11px]">Warden</span>
                <span className="text-[9px] text-slate-400 font-mono">Hostel 8</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('security')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-center transition cursor-pointer text-xs"
              >
                <QrCode className="w-3.5 h-3.5 text-blue-700 mx-auto mb-1" />
                <span className="font-bold text-slate-800 block text-[11px]">Security</span>
                <span className="text-[9px] text-slate-400 font-mono">Main Gate</span>
              </button>
            </div>
          </div>

          {/* Registration Link */}
          <div className="mt-5 text-center text-xs text-slate-500">
            <span>New student at GIKI? </span>
            <button
              onClick={onNavigateToRegister}
              className="font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
            >
              Register Institutional Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
