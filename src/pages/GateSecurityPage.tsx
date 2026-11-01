/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { GatePass } from '../types';
import { GateSecurityTerminal } from '../components/gate/GateSecurityTerminal';
import { ShieldCheck, RefreshCw } from 'lucide-react';

export const GateSecurityPage: React.FC = () => {
  const [approvedPasses, setApprovedPasses] = useState<GatePass[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApprovedPasses = async () => {
    setLoading(true);
    try {
      // In this environment, we fetch from passes endpoint
      const all = await api.getWardenPasses().catch(() => []);
      const approved = all.filter((p: GatePass) => p.status === 'APPROVED');
      setApprovedPasses(approved);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovedPasses();
  }, []);

  const handlePassUpdated = (updated: GatePass) => {
    setApprovedPasses((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <GateSecurityTerminal
        approvedPasses={approvedPasses}
        onPassUpdated={handlePassUpdated}
      />
    </div>
  );
};
