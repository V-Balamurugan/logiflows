import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  GitBranch,
  ArrowLeft,
  MapPin,
  Building,
  User as UserIcon,
  Phone,
  Mail,
  Map,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Ban,
  Save,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import {
  getBranchApi,
  updateBranchApi,
  deactivateBranchApi,
  activateBranchApi,
  getServiceAreasApi,
  addServiceAreaApi,
  deleteServiceAreaApi,
} from '../../api/branchApi';

const postalCodeSchema = z.object({
  postal_code: z
    .string()
    .min(3, 'Postal code must be at least 3 characters')
    .max(15, 'Postal code too long')
    .regex(/^[A-Za-z0-9 -]+$/, 'Alphanumeric characters, spaces, and hyphens only'),
});

type PostalFormValues = z.infer<typeof postalCodeSchema>;

export const BranchDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentMembership } = useTenant();
  const { user } = useAuth();

  const [isAddAreaModalOpen, setIsAddAreaModalOpen] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const isOrgAdmin =
    user?.role === 'PLATFORM_ADMIN' ||
    currentMembership?.role === 'ORGANIZATION_OWNER' ||
    currentMembership?.role === 'ORGANIZATION_ADMIN';

  // Branch data query
  const { data: branch, isLoading: isBranchLoading } = useQuery({
    queryKey: ['branch', id],
    queryFn: () => getBranchApi(id!),
    enabled: !!id,
  });

  // Service areas query
  const { data: serviceAreas = [], isLoading: isAreasLoading } = useQuery({
    queryKey: ['branch-service-areas', id],
    queryFn: () => getServiceAreasApi(id!),
    enabled: !!id,
  });

  const {
    register: registerArea,
    handleSubmit: handleSubmitArea,
    reset: resetArea,
    formState: { errors: areaErrors, isSubmitting: isAddingArea },
  } = useForm<PostalFormValues>({
    resolver: zodResolver(postalCodeSchema),
    defaultValues: { postal_code: '' },
  });

  const addAreaMutation = useMutation({
    mutationFn: (values: PostalFormValues) =>
      addServiceAreaApi(id!, { postal_code: values.postal_code, is_serviceable: true }),
    onSuccess: () => {
      setIsAddAreaModalOpen(false);
      resetArea();
      setConflictError(null);
      queryClient.invalidateQueries({ queryKey: ['branch-service-areas', id] });
      queryClient.invalidateQueries({ queryKey: ['branch', id] });
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.postal_code?.[0] ||
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Failed to add service area.';
      setConflictError(msg);
    },
  });

  const deleteAreaMutation = useMutation({
    mutationFn: (areaId: string) => deleteServiceAreaApi(id!, areaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch-service-areas', id] });
      queryClient.invalidateQueries({ queryKey: ['branch', id] });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: () =>
      branch?.status === 'ACTIVE' ? deactivateBranchApi(id!) : activateBranchApi(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch', id] });
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
  });

  if (isBranchLoading) {
    return <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-400">Loading branch details...</div>;
  }

  if (!branch) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <GitBranch className="w-12 h-12 mx-auto text-slate-600 mb-2" />
        <h2 className="text-xl font-bold text-white mb-2">Branch Not Found</h2>
        <Button variant="outline" size="sm" onClick={() => navigate('/branches')}>
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Branch Directory
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Navigation and Actions */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate('/branches')}
          className="inline-flex items-center text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Branches
        </button>

        {isOrgAdmin && (
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              className={
                branch.status === 'ACTIVE'
                  ? 'text-red-400 hover:text-red-300 hover:bg-red-950/60 border border-red-800/60'
                  : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/60 border border-emerald-800/60'
              }
              onClick={() => toggleStatusMutation.mutate()}
              disabled={toggleStatusMutation.isPending}
            >
              {branch.status === 'ACTIVE' ? (
                <>
                  <Ban className="w-3.5 h-3.5 mr-1" /> Deactivate Branch
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Activate Branch
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Main Header Card */}
      <Card className="p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Building className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">{branch.name}</h1>
                <Badge variant={branch.status === 'ACTIVE' ? 'success' : 'neutral'}>
                  {branch.status}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400">
                <span className="font-mono text-blue-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {branch.code}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {branch.address}, {branch.city}, {branch.state} - {branch.pincode}
                </span>
                {branch.contact_phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    {branch.contact_phone}
                  </span>
                )}
                {branch.contact_email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    {branch.contact_email}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-950 text-blue-400">
              <UserIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Branch Manager</div>
              <div className="text-sm font-semibold text-white">
                {branch.manager_name || 'Unassigned'}
              </div>
              {branch.manager_email && (
                <div className="text-xs text-slate-400">{branch.manager_email}</div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Service Areas Section */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Map className="w-5 h-5 text-emerald-400" />
            Serviceable Postal Codes ({serviceAreas.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Postal codes directly served by this branch. Overlapping coverage within this organization is automatically prevented.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setIsAddAreaModalOpen(true);
            setConflictError(null);
          }}
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add Postal Code
        </Button>
      </div>

      <Card className="overflow-hidden">
        {isAreasLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading service areas...</div>
        ) : serviceAreas.length === 0 ? (
          <div className="p-8 text-center">
            <Map className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <div className="text-slate-300 text-sm font-medium">No service areas defined</div>
            <p className="text-xs text-slate-500 mt-1">
              Add postal codes to declare delivery serviceability for this hub.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 p-4">
            {serviceAreas.map((area) => (
              <div
                key={area.id}
                className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between group hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="font-mono text-sm font-semibold text-emerald-400">
                    {area.postal_code}
                  </div>
                  <div className="text-2xs text-slate-500">Serviceable</div>
                </div>
                {isOrgAdmin && (
                  <button
                    onClick={() => deleteAreaMutation.mutate(area.id)}
                    className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-950/40 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove postal code"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add Postal Code Modal */}
      <Modal
        isOpen={isAddAreaModalOpen}
        onClose={() => setIsAddAreaModalOpen(false)}
        title="Add Serviceable Postal Code"
      >
        {conflictError && (
          <div className="mb-4 p-3 rounded bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400 mt-0.5" />
            <div>
              <span className="font-semibold">Coverage Conflict:</span> {conflictError}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmitArea((v) => addAreaMutation.mutate(v))} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Postal Code / PIN *
            </label>
            <Input
              {...registerArea('postal_code')}
              placeholder="e.g. 110006"
              className="font-mono text-sm uppercase"
            />
            {areaErrors.postal_code && (
              <p className="text-xs text-red-400 mt-1">{areaErrors.postal_code.message}</p>
            )}
            <p className="text-xs text-slate-500 mt-1">
              LogiFlows validates that this postal code is not already assigned to another branch in this organization.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddAreaModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isAddingArea || addAreaMutation.isPending}
            >
              {isAddingArea || addAreaMutation.isPending ? 'Validating & Adding...' : 'Add Postal Code'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BranchDetailPage;

