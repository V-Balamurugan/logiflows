export type BranchStatus = 'ACTIVE' | 'INACTIVE';

export interface ServiceArea {
  id: string;
  branch: string;
  branch_name: string;
  branch_code: string;
  postal_code: string;
  is_serviceable: boolean;
  created_at: string;
}

export interface Branch {
  id: string;
  organization: string;
  organization_code: string;
  organization_name: string;
  code: string;
  name: string;
  address: string;
  pincode: string;
  city: string;
  state: string;
  country: string;
  contact_email?: string;
  contact_phone?: string;
  latitude?: number | null;
  longitude?: number | null;
  operating_hours?: Record<string, string>;
  status: BranchStatus;
  manager?: string | null;
  manager_name?: string | null;
  manager_email?: string | null;
  service_areas?: ServiceArea[];
  service_area_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateBranchInput {
  organization: string;
  code: string;
  name: string;
  address: string;
  pincode: string;
  city: string;
  state: string;
  country?: string;
  contact_email?: string;
  contact_phone?: string;
  manager?: string | null;
}

export interface UpdateBranchInput {
  name?: string;
  address?: string;
  pincode?: string;
  city?: string;
  state?: string;
  country?: string;
  contact_email?: string;
  contact_phone?: string;
  status?: BranchStatus;
  manager?: string | null;
}

export interface ServiceabilityProvider {
  postal_code: string;
  is_serviceable: boolean;
  organization: {
    id: string;
    name: string;
    code: string;
  };
  branch: {
    id: string;
    name: string;
    code: string;
    city: string;
    state: string;
    contact_phone?: string;
  };
}

export interface ServiceabilityResponse {
  postal_code: string;
  is_serviceable: boolean;
  match_count: number;
  providers: ServiceabilityProvider[];
}
