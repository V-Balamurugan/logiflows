import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { registerOrganizationApi } from '../../api/organizationApi';
import { useTenant } from '../../context/TenantContext';

const orgSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  legal_name: z.string().min(2, 'Legal entity name must be at least 2 characters'),
  registration_number: z.string().optional(),
  code: z
    .string()
    .min(3, 'Code must be at least 3 characters')
    .max(50, 'Code cannot exceed 50 characters')
    .regex(/^[A-Za-z0-9_-]+$/, 'Code can only contain letters, numbers, hyphens, and underscores'),
  contact_email: z.string().email('Please enter a valid business contact email address'),
  contact_phone: z.string().optional(),
  address: z.string().optional(),
});

type OrgFormValues = z.infer<typeof orgSchema>;

export const RegisterOrganizationPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshMemberships } = useTenant();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ code: string; name: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OrgFormValues>({
    resolver: zodResolver(orgSchema),
    defaultValues: {
      name: '',
      legal_name: '',
      registration_number: '',
      code: '',
      contact_email: '',
      contact_phone: '',
      address: '',
    },
  });

  const onSubmit = async (data: OrgFormValues) => {
    try {
      setServerError(null);
      const res = await registerOrganizationApi(data);
      setSuccessData({ code: res.organization.code, name: res.organization.name });
      await refreshMemberships();
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.code?.[0] ||
        err.response?.data?.message ||
        'Failed to register organization. Please review your inputs.';
      setServerError(msg);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
        </button>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Register Organization</h1>
            <p className="text-sm text-slate-400">
              Onboard your logistics, courier, or postal business to the LogiFlows platform.
            </p>
          </div>
        </div>
      </div>

      {serverError && (
        <div className="mb-6 p-4 rounded-lg bg-red-950/60 border border-red-800/80 text-red-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-400" />
          <div>
            <div className="font-semibold text-sm">Submission Error</div>
            <div className="text-sm mt-0.5">{serverError}</div>
          </div>
        </div>
      )}

      {successData ? (
        <Card className="border-emerald-800/50 bg-emerald-950/20 p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-900/50 flex items-center justify-center text-emerald-400 mb-4 border border-emerald-700/50">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Registration Submitted Successfully!</h2>
          <p className="text-slate-300 max-w-lg mx-auto mb-6 text-sm">
            Your application for <strong className="text-white">{successData.name}</strong> (
            <code className="text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded text-xs font-mono">
              {successData.code}
            </code>
            ) has been received and is pending Platform Administrator review. You will receive an
            email notification upon approval.
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="primary" onClick={() => navigate('/profile')}>
              Go to Profile
            </Button>
            <Button variant="outline" onClick={() => navigate('/status')}>
              View System Status
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Business Name *
                </label>
                <Input
                  {...register('name')}
                  placeholder="e.g. Apex Logistics"
                  aria-invalid={!!errors.name}
                />
                {errors.name && (
                  <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Legal Entity Name *
                </label>
                <Input
                  {...register('legal_name')}
                  placeholder="e.g. Apex Logistics Private Limited"
                  aria-invalid={!!errors.legal_name}
                />
                {errors.legal_name && (
                  <p className="text-xs text-red-400 mt-1">{errors.legal_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Unique Organization Code *
                </label>
                <Input
                  {...register('code')}
                  placeholder="e.g. APEX-IND"
                  aria-invalid={!!errors.code}
                  className="font-mono uppercase"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Unique identifier used across dispatches, tracking, and branches.
                </p>
                {errors.code && (
                  <p className="text-xs text-red-400 mt-1">{errors.code.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Company / Tax Registration No.
                </label>
                <Input
                  {...register('registration_number')}
                  placeholder="e.g. CIN-U12345DL2026PTC"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Primary Contact Email *
                </label>
                <Input
                  type="email"
                  {...register('contact_email')}
                  placeholder="ops@company.com"
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
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Headquarters Address
              </label>
              <textarea
                {...register('address')}
                rows={3}
                placeholder="Street address, City, State, Postal code, Country"
                className="w-full rounded-md bg-slate-900 border border-slate-700 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};

export default RegisterOrganizationPage;

