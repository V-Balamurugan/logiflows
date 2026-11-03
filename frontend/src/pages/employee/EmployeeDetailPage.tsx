import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Users,
  ArrowLeft,
  Building,
  UserCheck,
  UserX,
  AlertCircle,
  Briefcase,
  Phone,
  Mail,
  Shield,
  Key,
  Calendar,
  Save,
  CheckCircle2,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import {
  getEmployeeApi,
  updateEmployeeApi,
  deactivateEmployeeApi,
  activateEmployeeApi,
} from '../../api/employeeApi';
import { getBranchesApi } from '../../api/branchApi';
import { Employee, EmployeeStatus, UpdateEmployeeInput } from '../../types/employee';

const updateEmployeeSchema = z.object({
  designation: z.string().max(100).optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED']),
  role: z.enum(['ORGANIZATION_ADMIN', 'BRANCH_MANAGER', 'EMPLOYEE']),
  branch_id: z.string().optional().or(z.literal('')),
});

type UpdateEmployeeFormValues = z.infer<typeof updateEmployeeSchema>;

export const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentOrganizationId, currentMembership } = useTenant();
  const { user } = useAuth();

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isOwner =
    user?.role === 'PLATFORM_ADMIN' || currentMembership?.role === 'ORGANIZATION_OWNER';
  const isOrgAdmin = isOwner || currentMembership?.role === 'ORGANIZATION_ADMIN';
  const isBranchManager = currentMembership?.role === 'BRANCH_MANAGER';
  const canManage = isOrgAdmin || isBranchManager;

  const {
    data: employee,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => getEmployeeApi(id!),
    enabled: !!id,
  });

  const { data: branchesData } = useQuery({
    queryKey: ['branches-select', currentOrganizationId],
    queryFn: () =>
      getBranchesApi({
        organization_id: currentOrganizationId || undefined,
        status: 'ACTIVE',
      }),
    enabled: !!currentOrganizationId || user?.role === 'PLATFORM_ADMIN',
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<UpdateEmployeeFormValues>({
    resolver: zodResolver(updateEmployeeSchema),
    values: employee
      ? {
          designation: employee.designation || '',
          phone: employee.phone || '',
          status: employee.status,
          role: (employee.role as any) || 'EMPLOYEE',
          branch_id: employee.branch_id || '',
        }
      : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateEmployeeInput) => updateEmployeeApi(id!, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['employee', id], updated);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setSaveSuccess(true);
      setErrorMessage(null);
      setTimeout(() => setSaveSuccess(false), 3500);
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.detail ||
        'Failed to update employee.';
      setErrorMessage(msg);
      setSaveSuccess(false);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: () => deactivateEmployeeApi(id!),
    onSuccess: (updated) => {
      queryClient.setQueryData(['employee', id], updated);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setErrorMessage(null);
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.detail ||
        'Failed to deactivate employee.';
      setErrorMessage(msg);
    },
  });

  const activateMutation = useMutation({
    mutationFn: () => activateEmployeeApi(id!),
    onSuccess: (updated) => {
      queryClient.setQueryData(['employee', id], updated);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setErrorMessage(null);
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.detail ||
        'Failed to activate employee.';
      setErrorMessage(msg);
    },
  });

  const onSubmit = (values: UpdateEmployeeFormValues) => {
    setErrorMessage(null);
    const payload: UpdateEmployeeInput = {
      designation: values.designation?.trim(),
      phone: values.phone?.trim(),
      status: values.status,
      role: isBranchManager ? undefined : values.role,
      branch_id: isBranchManager ? undefined : values.branch_id || null,
    };
    updateMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-gray-500">
        Loading employee details...
      </div>
    );
  }

  if (isError || !employee) {
    return (
      <div className="p-12 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-2 text-base font-medium text-gray-900">Employee not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The requested employee record does not exist or you do not have permission.
        </p>
        <Button onClick={() => navigate('/employees')} className="mt-4">
          Back to Employees
        </Button>
      </div>
    );
  }

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

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/employees"
            className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{employee.full_name}</h1>
              <Badge variant={getStatusBadgeVariant(employee.status)}>
                {employee.status}
              </Badge>
              {!employee.is_active && (
                <Badge variant="error">ACCOUNT DISABLED</Badge>
              )}
            </div>
            <p className="text-xs text-gray-400 font-mono mt-0.5">
              Code: {employee.employee_code} | Org: {employee.organization_name}
            </p>
          </div>
        </div>

        {canManage && (
          <div className="flex items-center gap-3">
            {employee.is_active ? (
              <Button
                variant="secondary"
                onClick={() => deactivateMutation.mutate()}
                disabled={deactivateMutation.isPending}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <UserX className="h-4 w-4 mr-1.5" />
                {deactivateMutation.isPending ? 'Deactivating...' : 'Deactivate Account'}
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() => activateMutation.mutate()}
                disabled={activateMutation.isPending}
                className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
              >
                <UserCheck className="h-4 w-4 mr-1.5" />
                {activateMutation.isPending ? 'Activating...' : 'Activate Account'}
              </Button>
            )}

            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={updateMutation.isPending}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>

      {saveSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
          <span>Employee profile updated successfully.</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Editable Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary-600" />
              Employment & Role Details
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Designation / Title
                  </label>
                  <Input
                    {...register('designation')}
                    placeholder="e.g. Operations Coordinator"
                    disabled={!canManage}
                    error={errors.designation?.message}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Employment Status
                  </label>
                  <select
                    {...register('status')}
                    disabled={!canManage}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="ON_LEAVE">ON LEAVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="TERMINATED">TERMINATED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    System Role
                  </label>
                  <select
                    {...register('role')}
                    disabled={!isOrgAdmin}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                  >
                    <option value="EMPLOYEE">Staff / Employee</option>
                    <option value="BRANCH_MANAGER">Branch Manager</option>
                    {isOwner && <option value="ORGANIZATION_ADMIN">Organization Admin</option>}
                  </select>
                  {!isOrgAdmin && (
                    <p className="text-[11px] text-gray-400 mt-1">
                      Only Organization Admins or Owners can modify user roles.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Branch Assignment
                  </label>
                  <select
                    {...register('branch_id')}
                    disabled={!isOrgAdmin}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                  >
                    <option value="">No Branch (HQ / Unassigned)</option>
                    {branchesData?.results?.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Contact Phone
                </label>
                <Input
                  {...register('phone')}
                  placeholder="+91 9876543210"
                  disabled={!canManage}
                  error={errors.phone?.message}
                />
              </div>
            </form>
          </Card>
        </div>

        {/* Right Column: Account & Security Overview */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary-600" />
              Account & Credentials
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-gray-500 block">User Account</span>
                <span className="font-medium text-gray-900">{employee.full_name}</span>
                <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <Mail className="h-3 w-3" />
                  {employee.email}
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500 block">Organization</span>
                <span className="font-medium text-gray-800">{employee.organization_name}</span>
                <span className="text-xs text-gray-400 font-mono block">
                  [{employee.organization_code}]
                </span>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500 block">Temporary Password</span>
                {employee.temporary_password_active ? (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                    <Key className="h-3.5 w-3.5" /> Must reset on next login
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Permanent password set
                  </span>
                )}
              </div>

              <div className="pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500 block">Joined Date</span>
                <span className="text-gray-700 flex items-center gap-1 text-xs">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  {new Date(employee.joined_date).toLocaleDateString()}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailPage;

