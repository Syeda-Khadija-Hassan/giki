/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GatePass, WhatsAppPreview } from '../types';

const API_PREFIX = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('giki_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_PREFIX}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.detail || data?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const whatsappService = {
  /**
   * Warden initiates parent consent request message via WhatsApp Business Cloud API.
   */
  requestParentConsent: (passId: number) =>
    request<GatePass>(`/warden/passes/${passId}/request-parent-consent`, {
      method: 'POST',
    }),

  /**
   * Warden resends consent request if needed or after delivery retry.
   */
  resendParentConsent: (passId: number) =>
    request<GatePass>(`/warden/passes/${passId}/resend-parent-consent`, {
      method: 'POST',
    }),

  /**
   * Fetches outbound message preview and recipient info for inspection/audit.
   */
  getPreview: (passId: number) => request<WhatsAppPreview>(`/whatsapp/preview/${passId}`),

  /**
   * Development simulation endpoint for simulating parent reply (YES / NO / other).
   */
  simulateReply: (passId: number, responseType: 'YES' | 'NO' | string) =>
    request<{ success: boolean; simulated: boolean; consent_status: string; message: string }>(
      '/whatsapp/simulate-reply',
      {
        method: 'POST',
        body: JSON.stringify({ pass_id: passId, response_type: responseType }),
      }
    ),
};
