import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Logo from '../components/common/Logo';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Activity, ArrowRight, BookOpen, Github, LogIn, User as UserIcon } from 'lucide-react';
import { useHealthQuery } from '../api/health';
import { useAuth } from '../context/AuthContext';

export const PublicLayout: React.FC = () => {
  const location = useLocation();
  const { data: health } = useHealthQuery(15000);
  const { user, isAuthenticated } = useAuth();

  const isHealthy = health?.status === 'healthy';

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Top Announcement Bar */}
      <div className="bg-slate-900/80 border-b border-slate-800/80 text-xs py-2 px-4 text-center text-slate-400 flex items-center justify-center gap-2">
        <span className="font-semibold text-teal-400">Phase 00 Foundation Active</span>
        <span className="hidden sm:inline text-slate-600">•</span>
        <span className="hidden sm:inline">Django 5 + React 18 + PostgreSQL 16 Enterprise Stack</span>
        <Link to="/app/status" className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1 ml-2">
          View Health Telemetry <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Logo size="md" />
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <Link
                to="/"
                className={`transition-colors ${location.pathname === '/' ? 'text-white font-medium' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Platform Overview
              </Link>
              <Link
                to="/app/architecture"
                className={`transition-colors ${location.pathname === '/app/architecture' ? 'text-white font-medium' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Architecture & Roadmap
              </Link>
              <Link
                to="/app/status"
                className={`transition-colors flex items-center gap-1.5 ${location.pathname === '/app/status' ? 'text-white font-medium' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <span>Dev Status</span>
                <Badge variant={isHealthy ? 'success' : 'warning'} size="sm" dot>
                  {isHealthy ? 'Live' : 'Checking'}
                </Badge>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="http://localhost:8000/api/v1/docs/"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/50 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span>Swagger API Docs</span>
            </a>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/profile"
                  className="hidden sm:flex items-center gap-2 text-xs text-slate-300 hover:text-white px-2 py-1"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    {user.first_name ? user.first_name[0].toUpperCase() : user.email[0].toUpperCase()}
                  </div>
                  <span className="max-w-[100px] truncate">{user.full_name || user.email}</span>
                </Link>
                <Link to="/dashboard">
                  <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Dashboard
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3 md:col-span-2">
            <Logo size="sm" asLink={false} />
            <p className="max-w-md text-slate-400 text-sm leading-relaxed">
              LogiFlows is an enterprise-grade AI-powered Smart Postal and B2B Logistics Management Web Platform.
              Engineered with Django, PostgreSQL, Docker, and React.
            </p>
            <p className="text-slate-500">
              © {new Date().getFullYear()} LogiFlows Engineering. All architectural foundations established under Phase 00.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-200 text-sm mb-3">Architecture & Foundation</h4>
            <ul className="space-y-2">
              <li><Link to="/app/architecture" className="hover:text-slate-200">System Architecture</Link></li>
              <li><Link to="/app/status" className="hover:text-slate-200">System Readiness & Health</Link></li>
              <li><a href="http://localhost:8000/api/v1/schema/" target="_blank" rel="noreferrer" className="hover:text-slate-200">OpenAPI 3.0 Schema</a></li>
              <li><a href="http://localhost:8000/api/v1/docs/" target="_blank" rel="noreferrer" className="hover:text-slate-200">Swagger UI API Explorer</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-200 text-sm mb-3">Project Standards</h4>
            <ul className="space-y-2">
              <li><span className="text-slate-500">Phase 00: Environment Setup (Active)</span></li>
              <li><span className="text-slate-500">Phase 01: Multi-Tenancy & Auth (Next)</span></li>
              <li><span className="text-slate-500">Phase 02: Fleet & Vehicle Master</span></li>
              <li><span className="text-slate-500">Phase 03: Booking & QR Custody</span></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
