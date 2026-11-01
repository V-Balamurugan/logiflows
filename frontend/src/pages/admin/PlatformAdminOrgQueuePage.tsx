import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldAlert,
  Search,
  CheckCircle,
  XCircle,
  Ban,
  Building,
  RefreshCw,
  Mail,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import {
  getOrganizationsApi,
  approveOrganizationApi,
  rejectOrganizationApi,
  suspendOrganizationApi,
} from '../../api/organizationApi';
import { Organization, OrganizationStatus } from '../../types/organization';

export const PlatformAdminOrgQueuePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModal, setActiveModal] = useState<{
    type: 'reject' | 'suspend' | null;
    org: Organization | null;
  }>({ type: null, org: null });
  const [reasonInput, setReasonInput] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-organizations', selectedStatus, searchQuery],
    queryFn: () =>
      getOrganizationsApi({
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        search: searchQuery || undefined,
      }),
  });

  const approveMutation = useMutation({
    mutationFn: (orgId: string) => approveOrganizationApi(orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
    },
    onError: (err: any) => {
      setActionError(err.response?.data?.error?.message || 'Failed to approve organization');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ orgId, reason }: { orgId: string; reason: string }) =>
      rejectOrganizationApi(orgId, reason),
    onSuccess: () => {
      setActiveModal({ type: null, org: null });
      setReasonInput('');
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
    },
    onError: (err: any) => {
      setActionError(err.response?.data?.error?.message || 'Failed to reject organization');
    },
  });

  const suspendMutation = useMutation({
    mutationFn: ({ orgId, reason }: { orgId: string; reason: string }) =>
      suspendOrganizationApi(orgId, reason),
    onSuccess: () => {
      setActiveModal({ type: null, org: null });
      setReasonInput('');
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
    },
    onError: (err: any) => {
      setActionError(err.response?.data?.error?.message || 'Failed to suspend organization');
    },
  });

  const handleActionConfirm = () => {
    if (!activeModal.org) return;
    if (!reasonInput.trim()) {
      setActionError('A valid reason is required.');
      return;
    }
    setActionError(null);
    if (activeModal.type === 'reject') {
      rejectMutation.mutate({ orgId: activeModal.org.id, reason: reasonInput });
    } else if (activeModal.type === 'suspend') {
      suspendMutation.mutate({ orgId: activeModal.org.id, reason: reasonInput });
    }
  };

  const getStatusBadge = (status: OrganizationStatus) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success">Approved</Badge>;
      case 'PENDING':
        return <Badge variant="warning">Pending Review</Badge>;
      case 'REJECTED':
        return <Badge variant="error">Rejected</Badge>;
      case 'SUSPENDED':
        return <Badge variant="error">Suspended</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const orgs = data?.results || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Platform Tenant Queue</h1>
            <p className="text-sm text-slate-400">
              Review, approve, reject, and suspend logistics enterprise organizations.
            </p>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={() => refetch()} className="self-start md:self-auto">
          <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh List
        </Button>
      </div>

      {actionError && (
        <div className="mb-6 p-4 rounded-lg bg-red-950/60 border border-red-800 text-red-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-sm">{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-xs text-red-400 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {['ALL', 'PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${
                  selectedStatus === st
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <Input
              type="text"
              placeholder="Search by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </div>
      </Card>

      {/* Organizations Table / List */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">Loading organizations...</div>
        ) : orgs.length === 0 ? (
          <div className="p-12 text-center">
            <Building className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <div className="text-slate-300 font-medium">No organizations found</div>
            <div className="text-xs text-slate-500 mt-1">
              No tenants match your active status or search filters.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Organization</th>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Applied</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {orgs.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{org.name}</div>
                      <div className="text-xs text-slate-400">{org.legal_name}</div>
                      {org.rejection_reason && (
                        <div className="mt-1 text-xs text-red-400">
                          Rejection note: {org.rejection_reason}
                        </div>
                      )}
                      {org.suspension_reason && (
                        <div className="mt-1 text-xs text-red-400">
                          Suspension note: {org.suspension_reason}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <code className="px-2 py-0.5 rounded bg-slate-800 text-blue-400 font-mono text-xs border border-slate-700">
                        {org.code}
                      </code>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(org.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-300">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        {org.contact_email}
                      </div>
                      {org.contact_phone && (
                        <div className="text-xs text-slate-400 mt-0.5">{org.contact_phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(org.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {org.status === 'PENDING' && (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => approveMutation.mutate(org.id)}
                              disabled={approveMutation.isPending}
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="text-red-400 hover:text-red-300 hover:bg-red-950/60 border border-red-800/60"
                              onClick={() => {
                                setActiveModal({ type: 'reject', org });
                                setReasonInput('');
                                setActionError(null);
                              }}
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                            </Button>
                          </>
                        )}

                        {org.status === 'APPROVED' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-950/60 border border-red-800/60"
                            onClick={() => {
                              setActiveModal({ type: 'suspend', org });
                              setReasonInput('');
                              setActionError(null);
                            }}
                          >
                            <Ban className="w-3.5 h-3.5 mr-1" /> Suspend
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Reject / Suspend Reason Modal */}
      <Modal
        isOpen={!!activeModal.type}
        onClose={() => setActiveModal({ type: null, org: null })}
        title={
          activeModal.type === 'reject'
            ? `Reject Organization: ${activeModal.org?.name}`
            : `Suspend Organization: ${activeModal.org?.name}`
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            {activeModal.type === 'reject'
              ? 'Please provide a clear justification reason for rejecting this organization application. This explanation will be documented in the audit log and emailed to the applicant.'
              : 'Please document the justification for suspending this active organization. Active tenant users will be blocked from accessing operations while suspended.'}
          </p>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Reason / Justification *
            </label>
            <textarea
              rows={4}
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              placeholder="Enter detailed reason (minimum 5 characters)..."
              className="w-full rounded-md bg-slate-900 border border-slate-700 text-slate-100 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveModal({ type: null, org: null })}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="text-white bg-red-600 hover:bg-red-700 border border-red-500"
              onClick={handleActionConfirm}
              disabled={rejectMutation.isPending || suspendMutation.isPending}
            >
              Confirm {activeModal.type === 'reject' ? 'Rejection' : 'Suspension'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PlatformAdminOrgQueuePage;
