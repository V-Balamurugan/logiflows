import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Activity,
  Menu,
  X,
  Palette,
  Home,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import Logo from '../common/Logo';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export interface AppShellProps {
  children?: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    {
      to: '/',
      label: 'Home & Overview',
      icon: <Home className="w-4 h-4" />,
      active: location.pathname === '/',
    },
    {
      to: '/status',
      label: 'API & DB Health',
      icon: <Activity className="w-4 h-4" />,
      active: location.pathname === '/status',
      badge: 'Live',
    },
    {
      to: '/design-system',
      label: 'Design System',
      icon: <Palette className="w-4 h-4" />,
      active: location.pathname === '/design-system',
      badge: 'Tokens',
    },
  ];

  // Dynamic breadcrumb generation
  const getBreadcrumbs = () => {
    const crumbs = [{ label: 'LogiFlows', path: '/' }];
    if (location.pathname === '/status') {
      crumbs.push({ label: 'Platform Health & Status', path: '/status' });
    } else if (location.pathname === '/design-system') {
      crumbs.push({ label: 'Enterprise Design System', path: '/design-system' });
    } else if (location.pathname !== '/') {
      crumbs.push({ label: location.pathname.replace('/', ''), path: location.pathname });
    }
    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar Header */}
      <header role="banner" className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Toggle navigation drawer"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Logo size="md" />
            <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono bg-blue-950/60 text-blue-400 border border-blue-800/40">
              Phase 00 Foundation
            </span>
          </div>

          <nav role="navigation" aria-label="Top navigation" className="hidden sm:flex items-center gap-3">
            <Link
              to="/status"
              className="text-xs text-slate-300 hover:text-white transition-colors px-3 py-1.5 rounded-md hover:bg-slate-800/60"
            >
              System Health
            </Link>
            <Link
              to="/design-system"
              className="text-xs text-slate-300 hover:text-white transition-colors px-3 py-1.5 rounded-md hover:bg-slate-800/60"
            >
              Design Tokens
            </Link>
            <a
              href="http://localhost:8000/api/v1/docs/"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-950/40 border border-blue-800/30"
            >
              <span>Swagger UI</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </nav>
        </div>
      </header>

      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Sidebar Navigation */}
        <aside
          role="navigation"
          aria-label="Sidebar navigation"
          className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 border-r border-slate-800 p-4 transition-transform duration-200 lg:static lg:translate-x-0 lg:bg-transparent lg:border-r-0 lg:p-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="lg:hidden flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <Logo size="sm" />
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Navigation
            </p>
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  link.active
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {link.icon}
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <Badge
                    variant={link.active ? 'default' : 'neutral'}
                    size="sm"
                    className={link.active ? 'bg-white/20 text-white' : ''}
                  >
                    {link.badge}
                  </Badge>
                )}
              </Link>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <div className="rounded-xl p-3.5 bg-slate-900/60 border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Security Baseline</span>
              </div>
              <p className="text-xs text-slate-400">
                UUID Keys, Case-Insensitive Email, HTTP-only JWT ready.
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Breadcrumbs Navigation */}
          <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs text-slate-400 mb-6">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.label}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-600" />}
                {idx === breadcrumbs.length - 1 ? (
                  <span className="text-slate-200 font-medium">{crumb.label}</span>
                ) : (
                  <Link to={crumb.path} className="hover:text-blue-400 transition-colors">
                    {crumb.label}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </nav>

          <main id="main-content" role="main" className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppShell;
