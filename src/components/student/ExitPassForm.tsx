/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { GatePass } from '../../types';
import {
  Send,
  Calendar,
  Clock,
  MapPin,
  FileText,
  AlertCircle,
  ShieldAlert,
  CheckCircle,
} from 'lucide-react';

interface ExitPassFormProps {
  onSuccess: (newPass: GatePass) => void;
}

export const ExitPassForm: React.FC<ExitPassFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();

  // Initialize with sensible default times (e.g. today + 2 hours departure, + 8 hours return)
  const getDefaultDeparture = () => {
    const d = new Date();
    d.setHours(d.getHours() + 2);
    d.setMinutes(0);
    return d.toISOString().slice(0, 16);
  };

  const getDefaultReturn = () => {
    const d = new Date();
    d.setHours(d.getHours() + 8);
    d.setMinutes(0);
    return d.toISOString().slice(0, 16);
  };

  const [destination, setDestination] = useState('');
  const [reason, setReason] = useState('');
  const [departureTime, setDepartureTime] = useState(getDefaultDeparture());
  const [expectedReturnTime, setExpectedReturnTime] = useState(getDefaultReturn());

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!destination.trim() || !reason.trim()) {
      setError('Please provide both the destination and reason for exit.');
      return;
    }

    const depDate = new Date(departureTime);
    const retDate = new Date(expectedReturnTime);
    const now = new Date();

    if (depDate.getTime() < now.getTime() - 5 * 60 * 1000) {
      setError('Departure time cannot be in the past.');
      return;
    }

    if (retDate.getTime() <= depDate.getTime()) {
      setError('Expected return time must be strictly later than departure time.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await api.createPass({
        destination: destination.trim(),
        reason: reason.trim(),
        departure_time: depDate.toISOString(),
        expected_return_time: retDate.toISOString(),
      });
      onSuccess(created);
      setDestination('');
      setReason('');
    } catch (err: any) {
      setError(err?.message || 'Failed to submit exit pass request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
        <div>
          <h3 className="text-base font-bold text-slate-900">New Campus Exit Request</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit your itinerary for warden review and parent WhatsApp consent.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Registered Parent Consent Info Box */}
      <div className="mb-5 p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-emerald-950 mb-1">
          <ShieldAlert className="w-4 h-4 text-emerald-700" />
          Mandatory Guardian Verification
        </div>
        <p className="text-emerald-800 leading-relaxed">
          The hostel warden will send an automated WhatsApp message to your registered guardian:{' '}
          <span className="font-semibold">{user?.parent_name || 'Registered Parent'}</span> (
          <span className="font-mono">{user?.parent_phone_masked || '+92 300 •••• 543'}</span>).
          Warden approval will remain locked until your guardian replies{' '}
          <span className="font-bold">YES</span>.
        </p>
      </div>

      <div className="space-y-4">
        {/* Destination */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Destination & Address <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              required
              placeholder="e.g. Islamabad F-7/2, Family Residence"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
            />
          </div>
        </div>

        {/* Reason */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Purpose / Reason for Leave <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <textarea
              required
              rows={2}
              placeholder="e.g. Attending family wedding / Medical appointment with family"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
            />
          </div>
        </div>

        {/* Departure & Return Timings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Planned Departure Date & Time <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                required
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Expected Return Date & Time <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                required
                value={expectedReturnTime}
                onChange={(e) => setExpectedReturnTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2.5 px-4 rounded-xl shadow-xs transition flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Submitting Request...' : 'Submit Exit Request to Warden'}
          </button>
        </div>
      </div>
    </form>
  );
};
