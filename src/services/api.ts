/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GatePass, UserProfile } from '../types';

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

export const api = {
  // Auth
  register: (payload: any) =>
    request<{ access_token: string; user_id: number; role: string; full_name: string; email: string }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify(payload) }
    ),

  login: (payload: { email: string; password: string }) =>
    request<{ access_token: string; user_id: number; role: string; full_name: string; email: string }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify(payload) }
    ),

  getMe: () => request<UserProfile>('/auth/me'),

  seedDatabase: () => request<{ message: string; accounts: string[] }>('/auth/seed', { method: 'POST' }),

  // Student
  createPass: (payload: {
    reason: string;
    destination: string;
    departure_time: string;
    expected_return_time: string;
  }) => request<GatePass>('/student/passes', { method: 'POST', body: JSON.stringify(payload) }),

  getMyPasses: () => request<GatePass[]>('/student/passes'),

  getMyPassById: (passId: number) => request<GatePass>(`/student/passes/${passId}`),

  // Warden
  getWardenPasses: () => request<GatePass[]>('/warden/passes'),

  getWardenPassById: (passId: number) => request<GatePass>(`/warden/passes/${passId}`),

  makeWardenDecision: (passId: number, payload: { decision: 'APPROVED' | 'REJECTED'; remarks: string }) =>
    request<GatePass>(`/warden/passes/${passId}/decision`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // Gate Checkpoint Security
  verifyGatePass: (signedToken: string) =>
    request<{
      success: boolean;
      message: string;
      pass_id: number;
      student_name: string;
      registration_number?: string;
      destination: string;
      departure_time: string;
      expected_return_time: string;
      actual_exit_time?: string | null;
      actual_return_time?: string | null;
      action_type: string;
      action_time: string;
    }>('/gate/verify', {
      method: 'POST',
      body: JSON.stringify({ signed_token: signedToken }),
    }),

  logExit: (signedToken: string) =>
    request<{
      success: boolean;
      message: string;
      pass_id: number;
      student_name: string;
      action_type: string;
      action_time: string;
    }>('/gate/exit', {
      method: 'POST',
      body: JSON.stringify({ signed_token: signedToken }),
    }),

  logReturn: (signedToken: string) =>
    request<{
      success: boolean;
      message: string;
      pass_id: number;
      student_name: string;
      action_type: string;
      action_time: string;
    }>('/gate/return', {
      method: 'POST',
      body: JSON.stringify({ signed_token: signedToken }),
    }),

  // Test Suite
  runTestSuite: () =>
    request<{
      timestamp: string;
      total_tests: number;
      passed_tests: number;
      failed_tests: number;
      results: Array<{ name: string; category: string; passed: boolean; message: string }>;
    }>('/test-suite/run'),
};
