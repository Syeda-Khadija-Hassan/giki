/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  Mail,
  User,
  Phone,
  Building,
  Home,
  Lock,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Shield,
  Smartphone,
} from 'lucide-react';

interface RegistrationPageProps {
  onNavigateToLogin: () => void;
}

export const RegistrationPage: React.FC<RegistrationPageProps> = ({ onNavigateToLogin }) => {
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [studentPhone, setStudentPhone] = useState('+92');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('+92');
  const [hostel, setHostel] = useState('Hostel 8');
  const [roomNumber, setRoomNumber] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-sync registration number when user enters institutional email
  const handleEmailChange = (val: string) => {
    setEmail(val);
    const match = val.trim().match(/^u(202\d{4})@giki\.edu\.pk$/i);
    if (match && !registrationNumber) {
      setRegistrationNumber(match[1]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validations
    const emailRegex = /^u(202\d{4})@giki\.edu\.pk$/i;
    const match = email.trim().match(emailRegex);
    if (!match) {
      setError(
        "Student email must be an institutional GIKI address matching 'u202xxxx@giki.edu.pk' (e.g., u2024626@giki.edu.pk). Personal email domains like Gmail are rejected."
      );
      return;
    }

    if (registrationNumber.trim() !== match[1]) {
      setError(
        `Registration number '${registrationNumber}' must strictly match the numeric part in '${email}' (${match[1]}).`
      );
      return;
    }

    const e164Regex = /^\+[1-9]\d{6,14}$/;
    const cleanStudentPhone = studentPhone.trim().replace(/[\s-]/g, '');
    const cleanParentPhone = parentPhone.trim().replace(/[\s-]/g, '');

    if (!e164Regex.test(cleanStudentPhone)) {
      setError('Student phone must be in valid international E.164 format (e.g. +923001234567).');
      return;
    }

    if (!e164Regex.test(cleanParentPhone)) {
      setError('Parent WhatsApp number must be in valid international E.164 format (e.g. +923009876543).');
      return;
    }

    setLoading(true);
    try {
      await register({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        registration_number: registrationNumber.trim(),
        student_phone: cleanStudentPhone,
        parent_name: parentName.trim(),
        parent_phone: cleanParentPhone,
        hostel: hostel.trim(),
        room_number: roomNumber.trim(),
        password,
      });
    } catch (err: any) {
      setError(err?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 py-8">
      <div className="max-w-xl w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-900 mx-auto flex items-center justify-center text-white shadow-md ring-4 ring-emerald-500/10">
            <GraduationCap className="w-7 h-7 text-emerald-300" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Institutional Student Registration
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            GIKI for Women Digital Exit Assistance & Warden Approval Portal
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Section 1: Academic Credentials */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                1. Institutional Identity
              </span>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Syeda Khadija Hassan"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Institutional Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="u2024626@giki.edu.pk"
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Format: u202xxxx@giki.edu.pk</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registration Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="2024626"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Must match numeric suffix</span>
                </div>
              </div>
            </div>

            {/* Section 2: Contact & Hostel */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                2. Contact & Campus Accommodation
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hostel</label>
                  <input
                    type="text"
                    required
                    value={hostel}
                    onChange={(e) => setHostel(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Room No</label>
                  <input
                    type="text"
                    required
                    placeholder="204"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Student Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+923001234567"
                    value={studentPhone}
                    onChange={(e) => setStudentPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Parent / Guardian WhatsApp */}
            <div className="space-y-3 pt-2 border-t border-slate-100 bg-emerald-50/40 p-3.5 rounded-2xl border border-emerald-100">
              <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
                3. Mandatory Parent / Guardian WhatsApp Contact
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Parent/Guardian Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Syed Hassan (Father)"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Parent WhatsApp Number (E.164) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+923009876543"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition font-mono"
                  />
                  <span className="text-[10px] text-emerald-800 mt-0.5 block font-medium">
                    Consent messages will be delivered to this WhatsApp number.
                  </span>
                </div>
              </div>
            </div>

            {/* Section 4: Password */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Account Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Complete Institutional Registration'}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-4 pt-4 border-t border-slate-100 text-center">
            <button
              onClick={onNavigateToLogin}
              className="text-xs text-slate-600 hover:text-slate-900 font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Already registered? Return to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
