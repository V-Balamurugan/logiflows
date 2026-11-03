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
  Package,
  Truck,
  UserCheck,
  FileText,
  Sparkles,
  Settings,
  Layers,
  ChevronRight,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ProcessFlowStepper from '../components/common/ProcessFlowStepper';
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
    <div className="space-y-10 max-w-7xl mx-auto" data-testid="dashboard-page-container">
      {/* ============================================================ */}
      {/* SECTION 1: Executive Command & Phase Milestone Header        */}
      {/* ============================================================ */}
      <section
        aria-labelledby="section-command-header"
        data-testid="section-command-header"
        className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 border border-slate-800 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span id="section-command-header" className="text-xs font-semibold tracking-wider uppercase text-indigo-400">
                LogiFlows Enterprise Command
              </span>
              <span className="text-slate-600">•</span>
              <Badge variant={getRoleBadgeVariant(user?.role)}>
                {user?.role?.replace('_', ' ')}
              </Badge>
              <Badge variant="teal" size="sm">
                Phase 02 Live
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

            {user?.role === 'CUSTOMER' && !summary?.has_tenant && (
              <Link to="/register-organization">
                <Button className="bg-primary-600 hover:bg-primary-500 text-white">
                  <Building className="h-4 w-4 mr-2" />
                  Register Organization
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Phase Milestone Progress Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-medium">Phase 02 Operational State:</span>
            <span>Multi-Tenant Organizations, Branch Hierarchy & Role RBAC Live</span>
          </div>
          <div className="flex items-center gap-2 text-indigo-300 font-medium">
            <span>Next Phase 03:</span>
            <span className="text-slate-400">Parcel Booking & Consignment Waybill Engine</span>
          </div>
        </div>
      </section>

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
          {/* ============================================================ */}
          {/* SECTION 2: Key Operational Metrics & Telemetry               */}
          {/* ============================================================ */}
          <section
            aria-labelledby="section-metrics-heading"
            data-testid="section-metrics"
            className="space-y-4"
          >
            {/* 1. Platform Admin Global Dashboard */}
            {summary.scope === 'GLOBAL' && (() => {
              const metrics = summary.metrics as PlatformAdminMetrics;
              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 id="section-metrics-heading" className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Activity className="h-5 w-5 text-indigo-600" />
                        Platform Global Telemetry
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Platform-wide health, pending queues, and active multi-tenant infrastructure.
                      </p>
                    </div>
                    <Badge variant="teal">Super Admin Scope</Badge>
                  </div>

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
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 id="section-metrics-heading" className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary-600" />
                        Organization Operations KPI
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Operational capacity, hubs, and active delivery workforce across your organization.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="teal">Tenant Workspace</Badge>
                      {summary.organization?.status === 'APPROVED' && (
                        <Badge variant="success">Verified Tenant</Badge>
                      )}
                    </div>
                  </div>

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
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 id="section-metrics-heading" className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <GitBranch className="h-5 w-5 text-primary-600" />
                        Branch Operations Hub: {summary.branch?.name || 'Assigned Branch'}
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Direct facility metrics, assigned couriers, and postal serviceability zones.
                      </p>
                    </div>
                    <Badge variant="teal">{summary.branch?.code || 'HUB'}</Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Card className="p-5 border-l-4 border-l-primary-500 hover:shadow-md transition-shadow">
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

                    <Card className="p-5 border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
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

            {/* 4. Dedicated Employee / Courier Dashboard */}
            {summary.scope === 'EMPLOYEE' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 id="section-metrics-heading" className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Users className="h-5 w-5 text-indigo-600" />
                      Courier & Operations Workforce Hub
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Your active courier operational assignment and branch context.
                    </p>
                  </div>
                  <Badge variant="info">Active Personnel</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <Card className="p-5 border-l-4 border-l-blue-500">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Assigned Organization
                    </div>
                    <div className="text-xl font-bold text-gray-900 mt-2">
                      {summary.organization?.name || 'LogiFlows Member'}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Code: [{summary.organization?.code || 'ORG'}]
                    </div>
                  </Card>

                  <Card className="p-5 border-l-4 border-l-teal-500">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Assigned Branch Hub
                    </div>
                    <div className="text-xl font-bold text-gray-900 mt-2">
                      {summary.branch?.name || 'Central Dispatch'}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {summary.branch?.code ? `Hub Code: ${summary.branch.code}` : 'All network hubs'}
                    </div>
                  </Card>

                  <Card className="p-5 border-l-4 border-l-emerald-500">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Staff Status
                    </div>
                    <div className="text-xl font-bold text-emerald-600 mt-2 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      Active Duty
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Authorized for field operations
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* 5. Customer / Unassigned Dashboard */}
            {summary.scope === 'PERSONAL' && (
              <div className="space-y-4 max-w-4xl mx-auto">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 id="section-metrics-heading" className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-indigo-600" />
                      Customer Logistics Portal
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Verify delivery network coverage and register a commercial logistics organization.
                    </p>
                  </div>
                  <Badge variant="teal">Customer Account</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-6 space-y-4">
                    <div className="p-2.5 w-fit rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900">
                      Check Delivery Serviceability
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Verify whether our enterprise logistics network serves your postal code. Instant checks against verified hubs and delivery service zones.
                    </p>
                    <Link to="/serviceability">
                      <Button size="sm" variant="secondary" className="w-full justify-center">
                        Open Serviceability Checker &rarr;
                      </Button>
                    </Link>
                  </Card>

                  <Card className="p-6 space-y-4 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border-blue-200">
                    <div className="p-2.5 w-fit rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                      <Building className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900">
                      Register a Logistics Company
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Are you a 3PL, carrier, or commercial logistics provider? Register your organization to establish branch hubs and manage delivery teams.
                    </p>
                    <Link to="/register-organization">
                      <Button size="sm" className="w-full justify-center bg-blue-600 hover:bg-blue-500 text-white">
                        Register Organization &rarr;
                      </Button>
                    </Link>
                  </Card>
                </div>
              </div>
            )}
          </section>

          {/* ============================================================ */}
          {/* SECTION 3: End-to-End Logistics Operational Process Flow     */}
          {/* ============================================================ */}
          <section
            aria-labelledby="section-process-flow-heading"
            data-testid="section-process-flow"
            className="pt-4 border-t border-gray-200"
          >
            <ProcessFlowStepper userRole={user?.role} />
          </section>

          {/* ============================================================ */}
          {/* SECTION 4: Role-Specific Action Center & Controls            */}
          {/* ============================================================ */}
          <section
            aria-labelledby="section-action-center-heading"
            data-testid="section-action-center"
            className="space-y-4 pt-4 border-t border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 id="section-action-center-heading" className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4 text-primary-600" />
                  Operational Command Center & Quick Controls
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Direct management utilities and verification tools enabled for your account role.
                </p>
              </div>
              <Badge variant="neutral" size="sm">
                Role-Enforced RBAC
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Tool 1: Postal Serviceability Checker (Available to all) */}
              <Card className="p-5 hover:border-emerald-300 transition-colors flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <Badge variant="teal" size="sm">Phase 02 Live</Badge>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900">Postal Coverage Verification</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Test live delivery serviceability for any 6-digit postal code against registered branch hub boundaries.
                  </p>
                </div>
                <Link to="/serviceability">
                  <Button size="sm" variant="secondary" className="w-full justify-between">
                    <span>Test Serviceability</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </Card>

              {/* Tool 2: Role-based Directory Link */}
              {user?.role === 'PLATFORM_ADMIN' ? (
                <Card className="p-5 hover:border-indigo-300 transition-colors flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                        <ShieldAlert className="h-5 w-5" />
                      </div>
                      <Badge variant="error" size="sm">Admin Only</Badge>
                    </div>
                    <h4 className="text-sm font-bold text-gray-900">Tenant Registration Queue</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Review, audit, approve, or reject organization applications submitted by business shippers and 3PLs.
                    </p>
                  </div>
                  <Link to="/admin/organizations">
                    <Button size="sm" className="w-full justify-between bg-indigo-600 hover:bg-indigo-500 text-white">
                      <span>Review Org Queue</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </Card>
              ) : user?.role !== 'CUSTOMER' ? (
                <Card className="p-5 hover:border-blue-300 transition-colors flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                        <GitBranch className="h-5 w-5" />
                      </div>
                      <Badge variant="info" size="sm">Hub Facilities</Badge>
                    </div>
                    <h4 className="text-sm font-bold text-gray-900">Branch & Hub Directory</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Inspect registered branch hubs, depot facilities, and active postal zone allocations.
                    </p>
                  </div>
                  <Link to="/branches">
                    <Button size="sm" variant="secondary" className="w-full justify-between">
                      <span>Explore Branches</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </Card>
              ) : (
                <Card className="p-5 hover:border-blue-300 transition-colors flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                        <Building className="h-5 w-5" />
                      </div>
                      <Badge variant="info" size="sm">B2B Onboarding</Badge>
                    </div>
                    <h4 className="text-sm font-bold text-gray-900">Logistics Organization Registration</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Submit an application to establish a tenant workspace with branch hubs and delivery personnel.
                    </p>
                  </div>
                  <Link to="/register-organization">
                    <Button size="sm" className="w-full justify-between bg-blue-600 hover:bg-blue-500 text-white">
                      <span>Register Company</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </Card>
              )}

              {/* Tool 3: Staff Management or Account Security */}
              {(user?.role === 'ORGANIZATION_OWNER' || user?.role === 'ORGANIZATION_ADMIN') ? (
                <Card className="p-5 hover:border-purple-300 transition-colors flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                        <Users className="h-5 w-5" />
                      </div>
                      <Badge variant="teal" size="sm">Workforce RBAC</Badge>
                    </div>
                    <h4 className="text-sm font-bold text-gray-900">Workforce & Staff Provisioning</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Provision employees, assign branch managers and couriers, and enforce privilege hierarchies.
                    </p>
                  </div>
                  <Link to="/employees">
                    <Button size="sm" variant="secondary" className="w-full justify-between">
                      <span>Manage Personnel</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </Card>
              ) : (
                <Card className="p-5 hover:border-slate-300 transition-colors flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <Badge variant="neutral" size="sm">Security</Badge>
                    </div>
                    <h4 className="text-sm font-bold text-gray-900">Account Profile & Security</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Manage cryptographic password credentials, active session tokens, and personal details.
                    </p>
                  </div>
                  <Link to="/profile">
                    <Button size="sm" variant="outline" className="w-full justify-between">
                      <span>Profile & Security</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </Card>
              )}
            </div>
          </section>

          {/* ============================================================ */}
          {/* SECTION 5: Next Phase Roadmap Preview & Capability Unlocks   */}
          {/* ============================================================ */}
          <section
            aria-labelledby="section-roadmap-preview-heading"
            data-testid="section-roadmap-preview"
            className="pt-4 border-t border-gray-200"
          >
            <Card className="p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-indigo-500/30 rounded-2xl relative overflow-hidden shadow-xl">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <Badge variant="teal" size="sm">Upcoming Milestone</Badge>
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                      Phase 03 — Parcel Booking & Waybill Engine
                    </span>
                  </div>
                  <h3 id="section-roadmap-preview-heading" className="text-xl sm:text-2xl font-extrabold text-white">
                    Next Capability Unlock: Self-Service Consignment Booking
                  </h3>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                    With Phase 02 organization workspaces, branch hubs, and postal delivery zones fully operational, Phase 03 will introduce:
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 pt-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span>Volumetric Weight Rating Engine</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span>Printable Barcode & QR Waybills</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span>Consignment Booking & Rate Cards</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span>Real-Time Address & Zone Routing</span>
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-stretch md:items-center shrink-0">
                  <Link to="/app/architecture">
                    <Button variant="secondary" className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700 w-full sm:w-auto">
                      <Layers className="h-4 w-4 mr-2" />
                      View 12-Phase Roadmap
                    </Button>
                  </Link>
                  <Link to="/serviceability">
                    <Button className="bg-teal-600 hover:bg-teal-500 text-white w-full sm:w-auto">
                      <MapPin className="h-4 w-4 mr-2" />
                      Check Postal Coverage
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </section>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
