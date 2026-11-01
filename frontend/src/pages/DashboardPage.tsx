import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Building,
  GitBranch,
  Users,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { getDashboardSummaryApi } from '../api/dashboardApi';
import {
  PlatformAdminMetrics,
  TenantMetrics,
  BranchManagerMetrics,
} from '../types/dashboard';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { currentOrganizationId, currentMembership } = useTenant();

  const {
    data: summary,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['dashboard-summary', currentOrganizationId],
    queryFn: () => getDashboardSummaryApi(currentOrganizationId || undefined),
  });

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case 'PLATFORM_ADMIN':
        return 'error';
      case 'ORGANIZATION_OWNER':
        return 'teal';
      case 'ORGANIZATION_ADMIN':
        return 'info';
      case 'BRANCH_MANAGER':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 border border-slate-800 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold tracking-wider uppercase text-indigo-400">
                LogiFlows Enterprise Command
              </span>
              <span className="text-slate-600">•</span>
              <Badge variant={getRoleBadgeVariant(user?.role)}>
                {user?.role?.replace('_', ' ')}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Welcome back, {user?.full_name || user?.email}
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              {summary?.organization
                ? `Operational workspace: ${summary.organization.name} [${summary.organization.code}]`
                : 'Central dispatch & multi-tenant logistics management overview.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {user?.role === 'PLATFORM_ADMIN' && (
              <Link to="/admin/organizations">
                <Button className="bg-indigo-600 hover:bg-indigo-500 text-white border-none shadow-lg shadow-indigo-600/30">
                  <ShieldAlert className="h-4 w-4 mr-2" />
                  Review Approvals
                </Button>
              </Link>
            )}

            {(user?.role === 'ORGANIZATION_OWNER' ||
              currentMembership?.role === 'ORGANIZATION_OWNER' ||
              currentMembership?.role === 'ORGANIZATION_ADMIN') && (
              <div className="flex gap-2">
                <Link to="/branches">
                  <Button variant="secondary" className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700">
                    <GitBranch className="h-4 w-4 mr-2" />
                    Hubs
                  </Button>
                </Link>
                <Link to="/employees">
                  <Button className="bg-primary-600 hover:bg-primary-500 text-white">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Staff
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-16 text-center text-gray-500">
          <Activity className="mx-auto h-8 w-8 animate-spin text-primary-500 mb-2" />
          Loading real-time operational metrics...
        </div>
      ) : isError || !summary ? (
        <div className="p-8 bg-red-50 border border-red-200 rounded-xl text-center text-red-700">
          Failed to load dashboard metrics. Please refresh.
        </div>
      ) : (
        <>
          {/* 1. Platform Admin Global Dashboard */}
          {summary.scope === 'GLOBAL' && (() => {
            const metrics = summary.metrics as PlatformAdminMetrics;
            return (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-indigo-600" />
                  Platform Global Telemetry
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <Card className="p-5 border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Pending Approvals
                      </span>
                      <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                        <Clock className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-gray-900 mt-2">
                      {metrics.pending_organizations}
                    </div>
                    <Link
                      to="/admin/organizations"
                      className="mt-3 inline-flex items-center text-xs font-medium text-amber-600 hover:text-amber-800"
                    >
                      Review registration queue &rarr;
                    </Link>
                  </Card>

                  <Card className="p-5 border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Active Tenants
                      </span>
                      <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <Building className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-gray-900 mt-2">
                      {metrics.approved_organizations}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Out of {metrics.total_organizations} total registered
                    </div>
                  </Card>

                  <Card className="p-5 border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Active Hubs
                      </span>
                      <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                        <GitBranch className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-gray-900 mt-2">
                      {metrics.active_branches}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {metrics.total_service_areas} active delivery service areas
                    </div>
                  </Card>

                  <Card className="p-5 border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Workforce Personnel
                      </span>
                      <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                        <Users className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-gray-900 mt-2">
                      {metrics.total_employees}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {metrics.total_users} system user accounts
                    </div>
                  </Card>
                </div>
              </div>
            );
          })()}

          {/* 2. Tenant Scoped Dashboard (Owner / Admin) */}
          {summary.scope === 'TENANT' && (() => {
            const metrics = summary.metrics as TenantMetrics;
            return (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary-600" />
                  Organization Operations KPI
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <Card className="p-5 border-l-4 border-l-primary-500 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Active Hubs & Branches
                      </span>
                      <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
                        <GitBranch className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-gray-900 mt-2">
                      {metrics.active_branches}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {metrics.total_branches} total registered branches
                    </div>
                    <Link
                      to="/branches"
                      className="mt-3 inline-flex items-center text-xs font-medium text-primary-600 hover:text-primary-800"
                    >
                      Manage hubs & service areas &rarr;
                    </Link>
                  </Card>

                  <Card className="p-5 border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Serviceable Postal Codes
                      </span>
                      <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                        <MapPin className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-gray-900 mt-2">
                      {metrics.total_service_areas}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Active postal delivery zones
                    </div>
                    <Link
                      to="/serviceability"
                      className="mt-3 inline-flex items-center text-xs font-medium text-emerald-600 hover:text-emerald-800"
                    >
                      Check postal serviceability &rarr;
                    </Link>
                  </Card>

                  <Card className="p-5 border-l-4 border-l-indigo-500 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Staff & Couriers
                      </span>
                      <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                        <Users className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-gray-900 mt-2">
                      {metrics.active_employees}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {metrics.total_employees} registered personnel
                    </div>
                    <Link
                      to="/employees"
                      className="mt-3 inline-flex items-center text-xs font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      Provision & manage staff &rarr;
                    </Link>
                  </Card>
                </div>
              </div>
            );
          })()}

          {/* 3. Branch Manager Scoped Dashboard */}
          {summary.scope === 'BRANCH' && (() => {
            const metrics = summary.metrics as BranchManagerMetrics;
            return (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-primary-600" />
                  Branch Operations Hub: {summary.branch?.name || 'Assigned Branch'}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Card className="p-5 border-l-4 border-l-primary-500">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Assigned Branch Staff
                      </span>
                      <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
                        <Users className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-gray-900 mt-2">
                      {metrics.assigned_employees}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {metrics.active_employees} active couriers & operators
                    </div>
                    <Link
                      to="/employees"
                      className="mt-3 inline-flex items-center text-xs font-medium text-primary-600 hover:text-primary-800"
                    >
                      View branch workforce &rarr;
                    </Link>
                  </Card>

                  <Card className="p-5 border-l-4 border-l-emerald-500">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Covered Postal Codes
                      </span>
                      <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                        <MapPin className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-gray-900 mt-2">
                      {metrics.service_areas_covered}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Active delivery service areas
                    </div>
                    <Link
                      to="/serviceability"
                      className="mt-3 inline-flex items-center text-xs font-medium text-emerald-600 hover:text-emerald-800"
                    >
                      Test postal serviceability &rarr;
                    </Link>
                  </Card>
                </div>
              </div>
            );
          })()}

          {/* 4. Customer / Unassigned Dashboard */}
          {summary.scope === 'PERSONAL' && (
            <Card className="p-8 text-center max-w-2xl mx-auto space-y-4">
              <Building className="mx-auto h-12 w-12 text-primary-600" />
              <h2 className="text-xl font-bold text-gray-900">
                Register Your Logistics Organization
              </h2>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Ready to manage your fleet, hubs, and delivery service areas? Register your logistics company to request tenant activation.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <Link to="/register-organization">
                  <Button className="flex items-center gap-2">
                    Register Organization <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/serviceability">
                  <Button variant="secondary">Check Postal Serviceability</Button>
                </Link>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default DashboardPage;

