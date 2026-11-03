import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Logo from '../components/common/Logo';
import Breadcrumbs from '../components/common/Breadcrumbs';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import {
  Activity,
  Boxes,
  Database,
  ExternalLink,
  Layers,
  Menu,
  Shield,
  Truck,
  Users,
  X,
  FileCode,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { useHealthQuery, useReadinessQuery } from '../api/health';

export const AppShellLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const { data: health } = useHealthQuery(10000);
  const { data: readiness } = useReadinessQuery(10000);

  const isHealthy = health?.status === 'healthy';
  const isDbReady = readiness?.ready ?? false;

  // Breadcrumbs calculation
  const getBreadcrumbs = () => {
    if (location.pathname === '/app/status') {
      return [{ label: 'App Shell', path: '/app/status' }, { label: 'Development Status' }];
    }
    if (location.pathname === '/app/architecture') {
      return [{ label: 'App Shell', path: '/app/status' }, { label: 'Architecture & Roadmap' }];
    }
    return [{ label: 'App Shell', path: '/app/status' }];
  };

  const navLinks = [
    {
      to: '/app/status',
      label: 'Development Status',
      icon: <Activity className="w-4 h-4" />,
      active: location.pathname === '/app/status',
      badge: 'Active',
    },
    {
      to: '/app/architecture',
      label: 'Architecture & Roadmap',
      icon: <Layers className="w-4 h-4" />,
      active: location.pathname === '/app/architecture',
      badge: '12 Phases',
    },
  ];

  const plannedModules = [
    { label: 'Multi-Tenant Orgs', icon: <Users className="w-4 h-4" />, phase: 'Phase 01' },
    { label: 'Role-Based RBAC', icon: <Shield className="w-4 h-4" />, phase: 'Phase 01' },
    { label: 'Fleet & Vehicles', icon: <Truck className="w-4 h-4" />, phase: 'Phase 02' },
    { label: 'Parcel Booking & QR', icon: <Boxes className="w-4 h-4" />, phase: 'Phase 03' },
    { label: 'Route Optimization', icon: <MapPin className="w-4 h-4" />, phase: 'Phase 07' },
    { label: 'AI Delay Engine', icon: <Sparkles className="w-4 h-4" />, phase: 'Phase 08' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 z-50 h-screen w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between">
          <Logo size="md" />
          <button
            className="md:hidden text-slate-400 hover:text-white p-1"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tenant Scope Card */}
        <div className="px-4 py-3 mx-4 my-3 bg-slate-950/60 rounded-lg border border-slate-800 text-xs">
          <div className="text-slate-500 font-medium">Tenant Context</div>
          <div className="font-semibold text-slate-200 mt-0.5 flex items-center justify-between">
            <span>Multi-Tenant Network</span>
            <Badge variant="teal" size="sm">Phase 02</Badge>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Multi-tenancy isolation and RBAC active</div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 px-3 py-2 space-y-6 overflow-y-auto">
          <div>
            <div className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Core Navigation
            </div>
            <nav className="space-y-1">
              {navLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    item.active
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <Badge variant={item.active ? 'info' : 'neutral'} size="sm">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <div className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Roadmap Modules</span>
              <span className="text-[10px] text-teal-400 font-mono">Planned</span>
            </div>
            <div className="space-y-1">
              {plannedModules.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between px-3 py-1.5 text-xs text-slate-400 rounded cursor-not-allowed opacity-75 hover:opacity-100"
                  title={`${item.label} scheduled for ${item.phase}`}
                >
                  <div className="flex items-center gap-2 text-slate-400">
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{item.phase}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-400 space-y-2">
          <div className="flex items-center justify-between">
            <span>PostgreSQL 16:</span>
            <Badge variant={isDbReady ? 'success' : 'error'} size="sm" dot>
              {isDbReady ? 'Connected' : 'Unavailable'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Django REST:</span>
            <Badge variant={isHealthy ? 'success' : 'error'} size="sm" dot>
              {isHealthy ? 'Healthy' : 'Degraded'}
            </Badge>
          </div>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 px-4 sm:px-6 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800"
              aria-label="Open Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Breadcrumbs items={getBreadcrumbs()} />
          </div>

          <div className="flex items-center gap-3">
            <a
              href="http://localhost:8000/api/v1/docs/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 transition-colors"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Swagger API Docs</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <Link to="/">
              <Button variant="secondary" size="sm">
                Public Website
              </Button>
            </Link>
          </div>
        </header>

        {/* Dynamic Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppShellLayout;
