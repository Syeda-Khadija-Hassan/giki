/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertTriangle, ShieldCheck, Sparkles } from 'lucide-react';

interface AcademicBannerProps {
  onOpenTestSuite?: () => void;
}

export const AcademicBanner: React.FC<AcademicBannerProps> = ({ onOpenTestSuite }) => {
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-900 px-4 py-2.5 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="font-semibold tracking-wide text-amber-950">
            Academic Prototype — This system does not provide official GIKI authorization.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden md:inline-flex text-amber-800 text-xs bg-amber-100/80 px-2 py-0.5 rounded border border-amber-200">
            Meta WhatsApp API & HMAC-SHA256 Ready
          </span>
          {onOpenTestSuite && (
            <button
              onClick={onOpenTestSuite}
              className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium px-2.5 py-1 rounded text-xs transition shadow-xs cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Run Security Test Suite
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
