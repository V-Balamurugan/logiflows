import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building, Save, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { useTenant } from '../../context/TenantContext';
import { getOrganizationApi, updateOrganizationApi } from '../../api/organizationApi';
import { Organization } from '../../types/organization';

const updateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  legal_name: z.string().min(2, 'Legal name must be at least 2 characters'),
  registration_number: z.string().optional(),
  contact_email: z.string().email('Please enter a valid email'),
  contact_phone: z.string().optional(),
  address: z.string().optional(),
});

type FormValues = z.infer<typeof updateSchema>;

export const OrganizationSettingsPage: React.FC = () => {
  const { currentOrganizationId, currentMembership, refreshMemberships } = useTenant();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(updateSchema),
  });

  useEffect(() => {
    const fetchOrg = async () => {
      if (!currentOrganizationId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await getOrganizationApi(currentOrganizationId);
        setOrganization(data);
        reset({
          name: data.name,
          legal_name: data.legal_name,
          registration_number: data.registration_number || '',
          contact_email: data.contact_email,
          contact_phone: data.contact_phone || '',
          address: data.address || '',
        });
      } catch (err: any) {
        setErrorMessage(err.response?.data?.error?.message || 'Failed to load organization profile');
      } finally {
        setLoading(false);
      }
    };

    fetchOrg();
  }, [currentOrganizationId, reset]);

  const onSubmit = async (values: FormValues) => {
    if (!currentOrganizationId) return;
    try {
      setErrorMessage(null);
      setSaveSuccess(false);
      const updated = await updateOrganizationApi(currentOrganizationId, values);
      setOrganization(updated);
      setSaveSuccess(true);
      await refreshMemberships();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error?.message || 'Failed to update organization profile');
    }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-12 text-center text-slate-400">Loading organization details...</div>;
  }

  if (!currentOrganizationId || !organization) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <Building className="w-12 h-12 mx-auto text-slate-600 mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">No Active Organization Context</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          You are not currently operating in an approved organization tenant context.
        </p>
      </div>
    );
  }

  const isOwner = currentMembership?.role === 'ORGANIZATION_OWNER';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              {organization.name}
              <Badge variant="success">Approved</Badge>
            </h1>
            <p className="text-sm text-slate-400">
              Manage organization metadata, legal profile, and tenant contact info.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <code className="px-3 py-1 rounded bg-slate-900 border border-slate-700 text-blue-400 font-mono text-sm">
            {organization.code}
          </code>
        </div>
      </div>

      {saveSuccess && (
        <div className="mb-6 p-4 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="text-sm">Organization profile and settings updated successfully.</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 rounded-lg bg-red-950/60 border border-red-800 text-red-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span className="text-sm">{errorMessage}</span>
        </div>
      )}

      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Organization Name
              </label>
              <Input
                {...register('name')}
                disabled={!isOwner}
                aria-invalid={!!errors.name}
              />
              {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Legal Registered Name
              </label>
              <Input
                {...register('legal_name')}
                disabled={!isOwner}
                aria-invalid={!!errors.legal_name}
              />
              {errors.legal_name && (
                <p className="text-xs text-red-400 mt-1">{errors.legal_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Organization Code (Immutable)
              </label>
              <Input
                value={organization.code}
                disabled
                className="font-mono bg-slate-900/50 text-slate-400"
              />
              <p className="text-xs text-slate-500 mt-1">Tenant codes cannot be modified after registration.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Registration / CIN Number
              </label>
              <Input
                {...register('registration_number')}
                disabled={!isOwner}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Primary Contact Email
              </label>
              <Input
                type="email"
                {...register('contact_email')}
                disabled={!isOwner}
                aria-invalid={!!errors.contact_email}
              />
              {errors.contact_email && (
                <p className="text-xs text-red-400 mt-1">{errors.contact_email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Primary Contact Phone
              </label>
              <Input
                {...register('contact_phone')}
                disabled={!isOwner}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Headquarters Street Address
            </label>
            <textarea
              {...register('address')}
              rows={3}
              disabled={!isOwner}
              className="w-full rounded-md bg-slate-900 border border-slate-700 text-slate-100 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>

          {isOwner && (
            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                <Save className="w-4 h-4 mr-1.5" />
                {isSubmitting ? 'Saving Settings...' : 'Save Settings'}
              </Button>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
};

export default OrganizationSettingsPage;

