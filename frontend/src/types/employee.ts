export type EmployeeStatus = 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TERMINATED';

export type EmployeeRole = 'ORGANIZATION_ADMIN' | 'BRANCH_MANAGER' | 'EMPLOYEE';

export interface Employee {
  id: string;
  organization_id: string;
  organization_code: string;
  organization_name: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: EmployeeRole | string;
  branch_id: string | null;
  branch_name: string | null;
  branch_code: string | null;
  employee_code: string;
  designation: string;
  phone: string;
  status: EmployeeStatus;
  is_active: boolean;
  joined_date: string;
  temporary_password_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateEmployeeInput {
  email: string;
  first_name: string;
  last_name: string;
  employee_code: string;
  role: string;
  branch_id?: string | null;
  designation?: string;
  phone?: string;
  temporary_password?: string;
}

export interface UpdateEmployeeInput {
  designation?: string;
  phone?: string;
  status?: EmployeeStatus;
  role?: string;
  branch_id?: string | null;
}
