import React from 'react';
import {
  Layers,
  CheckCircle2,
  Clock,
  Server,
  Database,
  Cpu,
  Shield,
  Building,
  GitBranch,
  Users,
  MapPin,
  Lock,
  Mail,
  Container,
  Activity,
  FileCheck,
  CheckCircle,
} from 'lucide-react';
import Badge from '../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import ProcessFlowStepper from '../components/common/ProcessFlowStepper';

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

  const architecturalPillars = [
    {
      icon: Building,
      title: 'Multi-Tenant Isolation Architecture',
      tag: 'Phase 02 Live',
      variant: 'info' as const,
      items: [
        'Strict tenant scoping via TenantScopedViewSetMixin enforcing database-level queryset isolation.',
        'Organization registration with audited approval queue (PENDING → APPROVED / REJECTED / SUSPENDED).',
        'Anti-spoofing validation on all mutations preventing cross-tenant injection.',
        'Zero cross-tenant data leakage across detail lookups, listings, updates, and metrics.',
      ],
    },
    {
      icon: GitBranch,
      title: 'Postal Branch Network & Serviceability',
      tag: 'Phase 02 Live',
      variant: 'success' as const,
      items: [
        'Physical logistics hubs, sorting depots, and transit facilities with unique branch codes.',
        'Postal code service area mapping with intra-organization overlap conflict detection.',
        'Public Serviceability Checker API (/branches/check-serviceability/) for instant routing validation.',
        'Branch-scoped operational views restricting branch managers to assigned physical hubs.',
      ],
    },
    {
      icon: Users,
      title: '6-Tier RBAC & Workforce Lifecycle',
      tag: 'Phase 02 Live',
      variant: 'teal' as const,
      items: [
        'Rigorous role hierarchy: PLATFORM_ADMIN, ORGANIZATION_OWNER, ORGANIZATION_ADMIN, BRANCH_MANAGER, EMPLOYEE, CUSTOMER.',
        'Secure staff provisioning with cryptographically random temporary credentials and onboarding invitations.',
        'Privilege escalation barriers: only Owners appoint Org Admins; Branch Managers appoint branch staff only.',
        'Atomic employee deactivation with immediate session invalidation and membership suspension.',
      ],
    },
    {
      icon: Lock,
      title: 'Enterprise Authentication & Security',
      tag: 'Phase 01 Live',
      variant: 'warning' as const,
      items: [
        'Custom User model with case-insensitive unique email index and UUID primary keys.',
        'Stateless short-lived access JWT + rotating refresh token in httpOnly, SameSite=Lax, Secure cookies.',
        'Single-use SHA-256 hashed activation and password reset tokens with 15-minute expiration.',
        'Brute-force account lockout (5 attempts / 15-minute freeze) and tamper-evident audit logging.',
      ],
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-8">
      {/* Title Header */}
      <div className="pb-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-teal-400" />
            <span>System Architecture & 12-Phase Roadmap</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Enterprise multi-tenant postal and B2B delivery management platform architectural blueprint.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="teal" size="sm" className="font-mono">v1.0.0-phase-02</Badge>
          <Badge variant="success" size="sm">Phase 01 & 02 Verified</Badge>
        </div>
      </div>

      {/* Interactive Process Flow Stepper */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <span>End-to-End Operational Logistics Progression</span>
          </h2>
          <span className="text-xs text-slate-500">Live Process State Tracker</span>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <ProcessFlowStepper />
        </div>
      </div>

      {/* Core Architectural Pillars */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Core Architectural Framework & Security Invariants</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {architecturalPillars.map((p, idx) => {
            const Icon = p.icon;
            return (
              <Card key={idx} className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-teal-400">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-bold text-white">{p.title}</h3>
                    </div>
                    <Badge variant={p.variant} size="sm">{p.tag}</Badge>
                  </div>
                  <ul className="space-y-2 mt-4 text-xs text-slate-300">
                    {p.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-teal-400 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Infrastructure & Persistence Topology */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
          <Container className="w-4 h-4 text-purple-400" />
          <span>Deployment Topology & Stack Specifications</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-400" />
                <CardTitle>Django Backend Layer</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-slate-300">
              <p>• Modular app architecture: <span className="font-mono text-blue-400">accounts, organizations, branches, employees, core</span></p>
              <p>• Strict settings hierarchy: <span className="font-mono text-slate-400">base.py, development.py, production.py</span></p>
              <p>• Production fail-fast guard on missing <span className="font-mono text-teal-400">SECRET_KEY</span> and database credentials</p>
              <p>• Standardized JSON error envelopes: <span className="font-mono text-slate-400">error.code, error.message, error.details</span></p>
              <p>• Automated OpenAPI 3.0 schema generation via <span className="font-mono text-teal-400">drf-spectacular</span></p>
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
              <p>• Dedicated database <span className="font-mono text-emerald-400">logiflows_db</span> with non-root user</p>
              <p>• Named persistent Docker volume <span className="font-mono text-slate-400">postgres_data</span> with healthcheck</p>
              <p>• Composite database indexes on tenant foreign keys and search fields</p>
              <p>• Deterministic migration execution before container initialization</p>
              <p>• Row-level isolation enforced via tenant foreign keys on all operational models</p>
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
              <p>• React 18 + TypeScript + Vite modern build toolchain</p>
              <p>• Tailwind CSS enterprise design system with curated Navy/Slate/Teal palette</p>
              <p>• TenantContext & AuthContext providing global state and active tenant switcher</p>
              <p>• TanStack Query caching with optimistic updates and background refetching</p>
              <p>• Centralized Axios client with automatic Bearer token injection and 401 refresh</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 12-Phase Roadmap Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div>
              <CardTitle>Complete 12-Phase Delivery Roadmap</CardTitle>
              <div className="text-xs text-slate-400 mt-1">
                Strict phase gating guarantees architectural integrity before downstream feature modules are unlocked.
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
