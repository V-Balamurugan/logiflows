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
      {/* Top Banner / Welcome with Phase Milestone Status */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 border border-slate-800 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-semibold tracking-wider uppercase text-indigo-400">
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
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-indigo-600" />
                    Platform Global Telemetry
                  </h2>
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

                {/* Platform Admin Action Center */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <Link to="/admin/organizations">
                    <Card className="p-4 hover:border-indigo-400 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                          <ShieldAlert className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">Tenant Registration Queue</div>
                          <div className="text-xs text-gray-500">Approve or reject organization applications</div>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </Card>
                  </Link>

                  <Link to="/serviceability">
                    <Card className="p-4 hover:border-emerald-400 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">Postal Serviceability Checker</div>
                          <div className="text-xs text-gray-500">Query serviceable postal codes across tenants</div>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </Card>
                  </Link>

                  <Link to="/status">
                    <Card className="p-4 hover:border-blue-400 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                          <Activity className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">Infrastructure Telemetry</div>
                          <div className="text-xs text-gray-500">Database latency and API probe health</div>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </Card>
                  </Link>
                </div>
              </div>
            );
          })()}

          {/* 2. Tenant Scoped Dashboard (Owner / Admin) */}
          {summary.scope === 'TENANT' && (() => {
            const metrics = summary.metrics as TenantMetrics;
            return (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary-600" />
                    Organization Operations KPI
                  </h2>
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

                {/* Tenant Quick Actions & Roadmap Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  <Card className="p-5 space-y-3">
                    <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Building className="h-4 w-4 text-primary-600" />
                      Organization Operational Controls
                    </div>
                    <p className="text-xs text-gray-500">
                      Configure your company profile, register physical branch hubs, assign branch managers, and define exclusive postal delivery zones.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Link to="/branches">
                        <Button size="sm" variant="secondary">
                          <GitBranch className="h-3.5 w-3.5 mr-1.5" />
                          Branches Directory
                        </Button>
                      </Link>
                      <Link to="/employees">
                        <Button size="sm" variant="secondary">
                          <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                          Staff Management
                        </Button>
                      </Link>
                      <Link to="/organization/settings">
                        <Button size="sm" variant="outline">
                          Profile Settings
                        </Button>
                      </Link>
                    </div>
                  </Card>

                  <Card className="p-5 space-y-3 bg-gradient-to-br from-indigo-50/60 to-blue-50/60 border-indigo-200">
                    <div className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                      <Package className="h-4 w-4 text-indigo-600" />
                      Phase 03 — Consignment & Parcel Booking Next
                    </div>
                    <p className="text-xs text-indigo-900/80 leading-relaxed">
                      Your branch hubs and service areas are configured and ready. In upcoming Phase 03, this workspace will activate direct parcel consignment booking, volumetric weight rating, and automated waybill barcode generation.
                    </p>
                    <div className="text-xs font-medium text-indigo-600 flex items-center gap-1.5 pt-1">
                      <Sparkles className="h-3.5 w-3.5" />
                      Phase 03 Parcel Engine: Ready for Development
                    </div>
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
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <GitBranch className="h-5 w-5 text-primary-600" />
                    Branch Operations Hub: {summary.branch?.name || 'Assigned Branch'}
                  </h2>
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

                <Card className="p-5 bg-gradient-to-r from-slate-50 to-indigo-50 border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-bold text-gray-900">Branch Dispatch & Custody Engine</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Inbound/outbound parcel manifests and scan transfer custody will unlock in upcoming Phase 03/05.
                    </div>
                  </div>
                  <Link to="/serviceability">
                    <Button size="sm" variant="secondary">
                      <MapPin className="h-4 w-4 mr-1.5" />
                      Check Postal Coverage
                    </Button>
                  </Link>
                </Card>
              </div>
            );
          })()}

          {/* 4. Dedicated Employee / Courier Dashboard */}
          {summary.scope === 'EMPLOYEE' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  Courier & Operations Workforce Hub
                </h2>
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

              {/* Employee Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Card className="p-5 space-y-3">
                  <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                    Delivery Serviceability Lookup
                  </div>
                  <p className="text-xs text-gray-500">
                    Search customer postal codes to check if your organization and branch service areas handle delivery.
                  </p>
                  <Link to="/serviceability">
                    <Button size="sm" variant="secondary">
                      Check Postal Code Serviceability &rarr;
                    </Button>
                  </Link>
                </Card>

                <Card className="p-5 space-y-3 bg-gradient-to-br from-indigo-50/60 to-blue-50/60 border-indigo-200">
                  <div className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                    <Package className="h-4 w-4 text-indigo-600" />
                    Delivery Runs & Consignments (Phase 03)
                  </div>
                  <p className="text-xs text-indigo-900/80">
                    Electronic run-sheets, barcode scanning handoffs, and digital proof-of-delivery (POD) workflows will be routed to your account in upcoming Phase 03.
                  </p>
                  <div className="text-xs font-medium text-indigo-600 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Ready for Phase 03 Delivery Engine
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* 5. Customer / Unassigned Dashboard */}
          {summary.scope === 'PERSONAL' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-indigo-600" />
                  Customer Logistics Portal
                </h2>
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

              {/* Customer Phase 03 Preview */}
              <Card className="p-6 bg-slate-900 text-white border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-teal-400">
                    <Package className="h-4 w-4" />
                    <span>Upcoming in Phase 03: Self-Service Parcel Booking</span>
                  </div>
                  <Badge variant="teal" size="sm">Coming Soon</Badge>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Phase 03 will introduce self-service parcel booking directly from this portal, including volumetric rate estimation, pickup requests, and printable waybills with real-time tracking barcodes.
                </p>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DashboardPage;
