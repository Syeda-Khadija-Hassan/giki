/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'STUDENT' | 'WARDEN' | 'SECURITY';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type ParentConsentStatus =
  | 'NOT_REQUESTED'
  | 'MESSAGE_PENDING'
  | 'AWAITING_RESPONSE'
  | 'YES'
  | 'NO'
  | 'DELIVERY_FAILED';

export type WhatsAppDeliveryStatus =
  | 'NOT_SENT'
  | 'QUEUED'
  | 'SENT'
  | 'DELIVERED'
  | 'READ'
  | 'FAILED';

export interface UserProfile {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  registration_number?: string | null;
  student_phone?: string | null;
  parent_name?: string | null;
  parent_phone_masked?: string | null;
  hostel?: string | null;
  room_number?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface GatePass {
  id: number;
  student_id: number;
  student_name: string;
  student_email: string;
  registration_number?: string | null;
  student_phone?: string | null;
  hostel?: string | null;
  room_number?: string | null;
  parent_name?: string | null;
  parent_phone_masked?: string | null;
  reason: string;
  destination: string;
  departure_time: string;
  expected_return_time: string;
  status: RequestStatus;
  parent_consent_status: ParentConsentStatus;
  parent_response_at?: string | null;
  parent_message_status: WhatsAppDeliveryStatus;
  parent_message_sent_at?: string | null;
  parent_message_error?: string | null;
  confirmation_reference?: string | null;
  warden_id?: number | null;
  warden_remarks?: string | null;
  warden_decision_at?: string | null;
  signed_token?: string | null;
  approved_at?: string | null;
  actual_exit_time?: string | null;
  actual_return_time?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface WhatsAppPreview {
  recipient_name: string;
  recipient_phone: string;
  recipient_phone_masked: string;
  message_body: string;
  reference: string;
  status: WhatsAppDeliveryStatus;
}
