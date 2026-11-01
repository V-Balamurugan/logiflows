import { UserRole } from './auth';

export type OrganizationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface Organization {
  id: string;
  name: string;
  legal_name: string;
  registration_number?: string;
  code: string;
  contact_email: string;
  contact_phone?: string;
  address?: string;
  status: OrganizationStatus;
  rejection_reason?: string;
  suspension_reason?: string;
  settings: Record<string, any>;
  owner_email?: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMembership {
  id: string;
  organization: string;
  organization_name: string;
  organization_code: string;
  organization_status: OrganizationStatus;
  user: string;
  user_email: string;
  user_full_name: string;
  role: UserRole;
  branch?: string | null;
  branch_name?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RegisterOrganizationInput {
  name: string;
  legal_name: string;
  registration_number?: string;
  code: string;
  contact_email: string;
  contact_phone?: string;
  address?: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  legal_name?: string;
  registration_number?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  settings?: Record<string, any>;
}

export interface ActionReasonInput {
  reason: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

