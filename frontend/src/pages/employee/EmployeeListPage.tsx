import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Users,
  Plus,
  Search,
  Building,
  UserCheck,
  AlertCircle,
  Briefcase,
  Phone,
  Mail,
  Shield,
  Key,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { getEmployeesApi, createEmployeeApi } from '../../api/employeeApi';
import { getBranchesApi } from '../../api/branchApi';
import { Employee, EmployeeStatus, CreateEmployeeInput } from '../../types/employee';

const createEmployeeSchema = z.object({
  email: z.string().email('Valid email is required'),
  first_name: z.string().min(1, 'First name is required').max(150),
  last_name: z.string().min(1, 'Last name is required').max(150),
  employee_code: z
    .string()
    .min(2, 'Employee code must be at least 2 characters')
    .max(50, 'Max 50 characters')
    .regex(/^[A-Za-z0-9_-]+$/, 'Alphanumeric, hyphens, and underscores only'),
  role: z.enum(['ORGANIZATION_ADMIN', 'BRANCH_MANAGER', 'EMPLOYEE']),
  branch_id: z.string().optional().or(z.literal('')),
  designation: z.string().max(100).optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
  temporary_password: z.string().min(8, 'Minimum 8 characters').optional().or(z.literal('')),
});

type CreateEmployeeFormValues = z.infer<typeof createEmployeeSchema>;

export const EmployeeListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { currentOrganizationId, currentMembership } = useTenant();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const isOwner =
    user?.role === 'PLATFORM_ADMIN' || currentMembership?.role === 'ORGANIZATION_OWNER';
  const isOrgAdmin = isOwner || currentMembership?.role === 'ORGANIZATION_ADMIN';
  const isBranchManager = currentMembership?.role === 'BRANCH_MANAGER';
  const canManage = isOrgAdmin || isBranchManager;

  const {
    data: employeesData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: [
      'employees',
      currentOrganizationId,
      roleFilter,
      statusFilter,
      searchQuery,
    ],
    queryFn: () =>
      getEmployeesApi({
        organization_id: currentOrganizationId || undefined,
        role: roleFilter !== 'ALL' ? roleFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: searchQuery.trim() || undefined,
      }),
    enabled: !!currentOrganizationId || user?.role === 'PLATFORM_ADMIN',
  });

  const { data: branchesData } = useQuery({
    queryKey: ['branches-select', currentOrganizationId],
    queryFn: () =>
      getBranchesApi({
        organization_id: currentOrganizationId || undefined,
        status: 'ACTIVE',
      }),
    enabled: isCreateModalOpen && (!!currentOrganizationId || user?.role === 'PLATFORM_ADMIN'),
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateEmployeeFormValues>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      role: 'EMPLOYEE',
      branch_id: isBranchManager ? currentMembership?.branch || '' : '',
    },
  });

  const selectedRole = watch('role');

  const createMutation = useMutation({
    mutationFn: (data: CreateEmployeeInput) => createEmployeeApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsCreateModalOpen(false);
      reset();
      setServerError(null);
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.detail ||
        'Failed to provision employee. Check input details.';
      setServerError(msg);
    },
  });

  const onSubmit = (values: CreateEmployeeFormValues) => {
    setServerError(null);
    const payload: CreateEmployeeInput = {
      email: values.email.trim(),
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
      employee_code: values.employee_code.trim().toUpperCase(),
      role: values.role,
      branch_id: values.branch_id ? values.branch_id : null,
      designation: values.designation?.trim() || undefined,
      phone: values.phone?.trim() || undefined,
      temporary_password: values.temporary_password || undefined,
    };
    createMutation.mutate(payload);
  };

  const getStatusBadgeVariant = (status: EmployeeStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'ON_LEAVE':
        return 'warning';
      case 'SUSPENDED':
      case 'TERMINATED':
        return 'error';
      default:
        return 'neutral';
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ORGANIZATION_ADMIN':
        return <Badge variant="info">Org Admin</Badge>;
      case 'BRANCH_MANAGER':
        return <Badge variant="teal">Branch Manager</Badge>;
      default:
        return <Badge variant="neutral">Employee</Badge>;
    }
  };

  const employees: Employee[] = employeesData?.results || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-7 w-7 text-primary-600" />
            Employees & Staff
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage organization workforce, staff roles, and branch assignments.
          </p>
        </div>

        {canManage && (
          <Button
            onClick={() => {
              setServerError(null);
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Employee
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, employee code, or designation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="ALL">All Roles</option>
              <option value="ORGANIZATION_ADMIN">Organization Admin</option>
              <option value="BRANCH_MANAGER">Branch Manager</option>
              <option value="EMPLOYEE">Staff / Employee</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="TERMINATED">Terminated</option>
            </select>

            {(searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('ALL');
                  setStatusFilter('ALL');
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Employee Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading employees...</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500">
            Failed to load employees. Please try again.
          </div>
        ) : employees.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-base font-medium text-gray-900">No employees found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL'
                ? 'Try adjusting your search filters.'
                : 'Get started by provisioning your first staff member.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Designation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">
                          {emp.first_name?.[0]}
                          {emp.last_name?.[0]}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">
                            {emp.full_name}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {emp.email}
                          </div>
                          <div className="text-xs font-mono text-gray-400 mt-0.5">
                            ID: {emp.employee_code}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(emp.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {emp.branch_name ? (
                        <div className="flex items-center gap-1">
                          <Building className="h-3.5 w-3.5 text-gray-400" />
                          <span>{emp.branch_name}</span>
                          <span className="text-xs text-gray-400 font-mono">
                            ({emp.branch_code})
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Unassigned (HQ)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div>{emp.designation || 'Staff'}</div>
                      {emp.phone && (
                        <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3" />
                          {emp.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <Badge variant={getStatusBadgeVariant(emp.status)}>
                          {emp.status}
                        </Badge>
                        {!emp.is_active && (
                          <span className="text-[10px] text-red-600 font-medium">
                            Account Inactive
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/employees/${emp.id}`}
                        className="text-primary-600 hover:text-primary-900 font-medium"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Employee Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          reset();
          setServerError(null);
        }}
        title="Provision New Employee"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <Input
                {...register('first_name')}
                placeholder="Jane"
                error={errors.first_name?.message}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <Input
                {...register('last_name')}
                placeholder="Doe"
                error={errors.last_name?.message}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <Input
              type="email"
              {...register('email')}
              placeholder="jane.doe@company.com"
              error={errors.email?.message}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Employee Code *
              </label>
              <Input
                {...register('employee_code')}
                placeholder="EMP-001"
                error={errors.employee_code?.message}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Role *
              </label>
              <select
                {...register('role')}
                disabled={isBranchManager}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="EMPLOYEE">Staff / Employee</option>
                {isOrgAdmin && <option value="BRANCH_MANAGER">Branch Manager</option>}
                {isOwner && <option value="ORGANIZATION_ADMIN">Organization Admin</option>}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Branch Assignment
              </label>
              {isBranchManager ? (
                <input
                  type="text"
                  disabled
                  value={currentMembership?.branch_name || 'Current Branch'}
                  className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-500"
                />
              ) : (
                <select
                  {...register('branch_id')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">No Branch (Headquarters / Central)</option>
                  {branchesData?.results?.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Designation / Job Title
              </label>
              <Input
                {...register('designation')}
                placeholder="Senior Dispatch Specialist"
                error={errors.designation?.message}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <Input
                {...register('phone')}
                placeholder="+91 9876543210"
                error={errors.phone?.message}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Initial Temporary Password
              </label>
              <Input
                type="password"
                {...register('temporary_password')}
                placeholder="Leave blank to auto-generate"
                error={errors.temporary_password?.message}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsCreateModalOpen(false);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Provisioning...' : 'Provision Employee'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EmployeeListPage;
