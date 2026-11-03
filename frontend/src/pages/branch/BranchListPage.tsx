import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  GitBranch,
  Plus,
  Search,
  MapPin,
  Building,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Map,
  RefreshCw,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { getBranchesApi, createBranchApi } from '../../api/branchApi';
import { getOrganizationsApi } from '../../api/organizationApi';
import { Branch } from '../../types/branch';

const branchSchema = z.object({
  code: z
    .string()
    .min(2, 'Branch code must be at least 2 characters')
    .max(50, 'Code cannot exceed 50 characters')
    .regex(/^[A-Za-z0-9_-]+$/, 'Letters, numbers, hyphens, and underscores only'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  address: z.string().min(5, 'Physical address is required'),
  pincode: z.string().min(3, 'Postal code is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  country: z.string().default('India'),
  contact_phone: z.string().optional(),
  contact_email: z.string().email('Valid email required').optional().or(z.literal('')),
});

type BranchFormValues = z.infer<typeof branchSchema>;

export const BranchListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { currentOrganizationId, currentMembership } = useTenant();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>('');
  const [modalOrgId, setModalOrgId] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const isPlatformAdmin = user?.role === 'PLATFORM_ADMIN';
  const isOrgAdmin =
    isPlatformAdmin ||
    currentMembership?.role === 'ORGANIZATION_OWNER' ||
    currentMembership?.role === 'ORGANIZATION_ADMIN';

  const { data: orgsData } = useQuery({
    queryKey: ['approved-organizations-select'],
    queryFn: () => getOrganizationsApi({ status: 'APPROVED' }),
    enabled: isPlatformAdmin,
  });

  const approvedOrgs = orgsData?.results || [];
  const effectiveOrgId = isPlatformAdmin
    ? (selectedOrgFilter || undefined)
    : (currentOrganizationId || undefined);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['branches', effectiveOrgId, searchQuery, statusFilter],
    queryFn: () =>
      getBranchesApi({
        organization_id: effectiveOrgId,
        search: searchQuery || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      code: '',
      name: '',
      address: '',
      pincode: '',
      city: '',
      state: '',
      country: 'India',
      contact_phone: '',
      contact_email: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: BranchFormValues) => {
      const targetOrg = isPlatformAdmin
        ? (modalOrgId || selectedOrgFilter || approvedOrgs[0]?.id)
        : currentOrganizationId;
      if (!targetOrg) {
        throw new Error('Please select an active organization context.');
      }
      return createBranchApi({
        ...values,
        organization: targetOrg,
      });
    },
    onSuccess: () => {
      setIsCreateModalOpen(false);
      reset();
      setServerError(null);
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
    onError: (err: any) => {
      setServerError(
        err.response?.data?.error?.message ||
          err.response?.data?.code?.[0] ||
          err.response?.data?.organization?.[0] ||
          err.response?.data?.message ||
          err.message ||
          'Failed to create branch.'
      );
    },
  });

  const onSubmit = (values: BranchFormValues) => {
    createMutation.mutate(values);
  };

  const branches = data?.results || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <GitBranch className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Postal & Logistics Branches</h1>
            <p className="text-sm text-slate-400">
              Manage sorting hubs, regional transit centers, and serviceable delivery postal codes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
          </Button>
          {isOrgAdmin && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setIsCreateModalOpen(true);
                setServerError(null);
              }}
            >
              <Plus className="w-4 h-4 mr-1.5" /> Add Branch
            </Button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-2">
              {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${
                    statusFilter === st
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {isPlatformAdmin && approvedOrgs.length > 0 && (
              <select
                value={selectedOrgFilter}
                onChange={(e) => setSelectedOrgFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="">All Organizations</option>
                {approvedOrgs.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.code})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <Input
              type="text"
              placeholder="Search by code, city, name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </div>
      </Card>

      {/* Branches Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">Loading branch networks...</div>
        ) : branches.length === 0 ? (
          <div className="p-12 text-center">
            <Building className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <div className="text-slate-300 font-medium">No branches found</div>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No physical hubs match your filters. Add a branch to begin defining service areas and allocating deliveries.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Branch</th>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Manager</th>
                  <th className="px-6 py-4">Service Areas</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {branches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{b.name}</div>
                      <div className="text-xs text-slate-400 truncate max-w-xs">{b.address}</div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="px-2 py-0.5 rounded bg-slate-800 text-blue-400 font-mono text-xs border border-slate-700">
                        {b.code}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {b.city}, {b.state}
                      </div>
                      <div className="text-slate-400 mt-0.5">PIN: {b.pincode}</div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {b.manager_name ? (
                        <div className="flex items-center gap-1.5">
                          <UserIcon className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-slate-200">{b.manager_name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Map className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="font-medium text-slate-200">{b.service_area_count || 0}</span>
                        <span className="text-slate-500">postal codes</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={b.status === 'ACTIVE' ? 'success' : 'neutral'}>
                        {b.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/branches/${b.id}`}
                        className="inline-flex items-center px-3 py-1.5 rounded text-xs font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-950/40 border border-blue-800/40"
                      >
                        Manage & Areas →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Branch Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Postal / Logistics Branch"
      >
        {serverError && (
          <div className="mb-4 p-3 rounded bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {isPlatformAdmin && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Target Organization *
              </label>
              <select
                value={modalOrgId || selectedOrgFilter || approvedOrgs[0]?.id || ''}
                onChange={(e) => setModalOrgId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                {approvedOrgs.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Branch Code *
              </label>
              <Input
                {...register('code')}
                placeholder="e.g. DEL-NORTH"
                className="font-mono uppercase text-xs"
              />
              {errors.code && <p className="text-xs text-red-400 mt-0.5">{errors.code.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Branch Name *
              </label>
              <Input
                {...register('name')}
                placeholder="e.g. Delhi North Hub"
                className="text-xs"
              />
              {errors.name && <p className="text-xs text-red-400 mt-0.5">{errors.name.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Physical Street Address *
            </label>
            <Input
              {...register('address')}
              placeholder="e.g. Plot 4, Transport Nagar, Kashmere Gate"
              className="text-xs"
            />
            {errors.address && <p className="text-xs text-red-400 mt-0.5">{errors.address.message}</p>}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Postal Code *
              </label>
              <Input {...register('pincode')} placeholder="110006" className="text-xs font-mono" />
              {errors.pincode && (
                <p className="text-xs text-red-400 mt-0.5">{errors.pincode.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                City *
              </label>
              <Input {...register('city')} placeholder="Delhi" className="text-xs" />
              {errors.city && <p className="text-xs text-red-400 mt-0.5">{errors.city.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                State *
              </label>
              <Input {...register('state')} placeholder="Delhi" className="text-xs" />
              {errors.state && <p className="text-xs text-red-400 mt-0.5">{errors.state.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Branch Phone
              </label>
              <Input {...register('contact_phone')} placeholder="+91 11 2345 6789" className="text-xs" />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Branch Email
              </label>
              <Input {...register('contact_email')} placeholder="delhi.north@ops.com" className="text-xs" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting || createMutation.isPending}
            >
              {isSubmitting || createMutation.isPending ? 'Creating Branch...' : 'Create Branch'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BranchListPage;

