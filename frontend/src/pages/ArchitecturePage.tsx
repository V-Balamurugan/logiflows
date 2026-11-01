import React from 'react';
import {
  Layers,
  CheckCircle2,
  Clock,
  ArrowRight,
  Server,
  Database,
  Cpu,
  Shield,
  Boxes,
  Truck,
  MapPin,
  Sparkles,
  FileCheck,
  CreditCard,
  BarChart3,
  Rocket,
} from 'lucide-react';
import Badge from '../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

export const ArchitecturePage: React.FC = () => {
  const phases = [
    {
      phase: 'Phase 00',
      title: 'Project Initialization & Docker Setup',
      status: 'COMPLETE',
      badgeVariant: 'success' as const,
      description: 'Repository structure, Django 5.1 backend, React 18 frontend, PostgreSQL 16, Docker Compose, automated tests, OpenAPI.',
    },
    {
      phase: 'Phase 01',
      title: 'Authentication & User Management',
      status: 'COMPLETE',
      badgeVariant: 'success' as const,
      description: 'Custom User model, JWT authentication in httpOnly cookies, single-use tokens, audit logging, and RBAC baseline.',
    },
    {
      phase: 'Phase 02',
      title: 'Multi-Tenant Architecture, Branch Hierarchy & RBAC',
      status: 'COMPLETE',
      badgeVariant: 'success' as const,
      description: 'Organization registration & approval queue, tenant isolation middleware, branch hierarchy, employee provisioning, role dashboards.',
    },
    {
      phase: 'Phase 03',
      title: 'Parcel Booking & Waybill Generation',
      status: 'READY',
      badgeVariant: 'info' as const,
      description: 'Consignment booking, dimensional weight calculation, waybill and barcode generation, sender/recipient address validation.',
    },
    {
      phase: 'Phase 04',
      title: 'Fleet & Vehicle Master Management',
      status: 'BACKLOG',
      badgeVariant: 'neutral' as const,
      description: 'Vehicle registry, capacity dimensions, driver assignments, vehicle telematics hooks.',
    },
    {
      phase: 'Phase 05',
      title: 'Branch & Hub Operations',
      status: 'BACKLOG',
      badgeVariant: 'neutral' as const,
      description: 'Hub inbound/outbound staging, bin allocations, transfer manifest management.',
    },
    {
      phase: 'Phase 06',
      title: 'Delivery Assignment & Dispatch',
      status: 'BACKLOG',
      badgeVariant: 'neutral' as const,
      description: 'Run-sheet generation, driver app dispatch, proof-of-delivery (POD) workflows.',
    },
    {
      phase: 'Phase 07',
      title: 'Dynamic Route Optimization',
      status: 'BACKLOG',
      badgeVariant: 'neutral' as const,
      description: 'Multi-stop TSP routing, road speed constraints, traffic estimation, geofencing.',
    },
    {
      phase: 'Phase 08',
      title: 'AI Delivery Delay Prediction',
      status: 'BACKLOG',
      badgeVariant: 'neutral' as const,
      description: 'Machine learning feature pipelines, delay risk scoring, proactive exception notification.',
    },
    {
      phase: 'Phase 09',
      title: 'Real-Time Tracking & Notifications',
      status: 'BACKLOG',
      badgeVariant: 'neutral' as const,
      description: 'WebSockets tracking milestones, customer SMS/email alerts, webhook dispatch.',
    },
    {
      phase: 'Phase 10',
      title: 'Contract Invoicing & Billing',
      status: 'BACKLOG',
      badgeVariant: 'neutral' as const,
      description: 'Contract tariff calculation, invoice PDF generation, credit terms, payment tracking.',
    },
    {
      phase: 'Phase 11',
      title: 'Analytics & Executive Intelligence',
      status: 'BACKLOG',
      badgeVariant: 'neutral' as const,
      description: 'SLA breach tracking, fleet utilization metrics, carbon emission reporting, exportable BI.',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Layers className="w-6 h-6 text-teal-400" />
          <span>System Architecture & 12-Phase Roadmap</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          High-level architectural blueprint and phase delivery tracker for the LogiFlows logistics platform.
        </p>
      </div>

      {/* Architecture Topology */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-blue-400" />
              <CardTitle>Django Backend Layer</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-slate-300">
            <p>• Modular app architecture under <span className="font-mono text-blue-400">apps/</span></p>
            <p>• Clean separation of settings (<span className="font-mono text-slate-400">base, dev, test</span>)</p>
            <p>• Custom User model inheriting <span className="font-mono text-teal-400">AbstractUser</span></p>
            <p>• Standardized error envelopes via DRF exception handler</p>
            <p>• OpenAPI 3.0 auto-schema generation via drf-spectacular</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <CardTitle>PostgreSQL 16 Persistence</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-slate-300">
            <p>• Dedicated database <span className="font-mono text-emerald-400">logiflows_db</span></p>
            <p>• Dedicated user <span className="font-mono text-slate-400">logiflows_user</span></p>
            <p>• Named persistent Docker volume <span className="font-mono text-slate-400">postgres_data</span></p>
            <p>• Health check probe using <span className="font-mono text-slate-400">pg_isready</span></p>
            <p>• Deterministic migration execution before app boot</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-purple-400" />
              <CardTitle>React 18 Frontend Layer</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-slate-300">
            <p>• React 18 + TypeScript + Vite modern build tool</p>
            <p>• Tailwind CSS design system with curated Navy/Blue/Teal tokens</p>
            <p>• React Router declarative client-side routing</p>
            <p>• TanStack Query centralized server-state caching</p>
            <p>• Centralized Axios instance with environment proxy</p>
          </CardContent>
        </Card>
      </div>

      {/* 12-Phase Roadmap Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div>
              <CardTitle>Complete 12-Phase Delivery Roadmap</CardTitle>
              <div className="text-xs text-slate-400 mt-1">
                Strict phase gating guarantees architectural integrity before feature modules are unlocked.
              </div>
            </div>
            <Badge variant="teal">Agile Sprint Plan</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-800/80">
            {phases.map((p) => (
              <div key={p.phase} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start gap-3">
                  <div className="pt-0.5">
                    {p.status === 'COMPLETE' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Clock className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-300">{p.phase}:</span>
                      <span className="text-sm font-medium text-slate-100">{p.title}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{p.description}</div>
                  </div>
                </div>
                <div className="self-end sm:self-center">
                  <Badge variant={p.badgeVariant} size="sm">
                    {p.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ArchitecturePage;
