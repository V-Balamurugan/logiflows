import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Boxes,
  Cpu,
  Database,
  Globe,
  Layers,
  MapPin,
  QrCode,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
  Workflow,
  CheckCircle2,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';

export const LandingPage: React.FC = () => {
  const plannedFeatures = [
    {
      icon: <Users className="w-6 h-6 text-blue-400" />,
      title: 'Multi-Tenant Organization Management',
      phase: 'Phase 01',
      description:
        'Tenant-scoped isolation for 3PL providers, carriers, shippers, and freight forwarders with role-based access control.',
    },
    {
      icon: <Truck className="w-6 h-6 text-teal-400" />,
      title: 'Carrier & Fleet Tracking',
      phase: 'Phase 02',
      description:
        'Comprehensive vehicle registration, capacity thresholds, maintenance logs, and live telematics telemetry.',
    },
    {
      icon: <QrCode className="w-6 h-6 text-indigo-400" />,
      title: 'QR-Based Parcel Custody',
      phase: 'Phase 03',
      description:
        'Cryptographically signed QR custody handoffs with tamper-evident chain-of-custody transfer records.',
    },
    {
      icon: <MapPin className="w-6 h-6 text-amber-400" />,
      title: 'Dynamic Route Optimization',
      phase: 'Phase 07',
      description:
        'Multi-stop TSP routing engines optimizing for road congestion, delivery priority windows, and fuel efficiency.',
    },
    {
      icon: <Sparkles className="w-6 h-6 text-purple-400" />,
      title: 'AI Delivery Delay Prediction',
      phase: 'Phase 08',
      description:
        'Machine-learning predictive models scoring weather impact, customs friction, and hub congestion risk.',
    },
    {
      icon: <Workflow className="w-6 h-6 text-emerald-400" />,
      title: 'Automated Freight Invoicing',
      phase: 'Phase 10',
      description:
        'SLA rating cards, automated tax calculation, detention charges, and electronic invoice distribution.',
    },
  ];

  return (
    <div className="space-y-24 py-12 md:py-16">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-medium">
          <Badge variant="teal" size="sm">Phase 02 Live</Badge>
          <span>Multi-Tenant Network, Branch Hierarchy & Role RBAC Active</span>
        </div>

        <div className="space-y-4 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            AI-Powered Smart Postal & <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-teal-400">
              B2B Logistics Management
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            A centralized, multi-tenant digital backbone for modern supply chains. Connecting logistics organizations,
            branches, vehicle fleets, and parcel custody under high-availability containerized micro-services.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
          <Link to="/app/status">
            <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Open Dev Console & Health
            </Button>
          </Link>
          <Link to="/app/architecture">
            <Button size="lg" variant="secondary" leftIcon={<Layers className="w-4 h-4" />}>
              Explore 12-Phase Roadmap
            </Button>
          </Link>
          <a href="http://localhost:8000/api/v1/docs/" target="_blank" rel="noreferrer">
            <Button size="lg" variant="outline" leftIcon={<Globe className="w-4 h-4" />}>
              OpenAPI / Swagger
            </Button>
          </a>
        </div>

        {/* Visual Platform Banner */}
        <div className="pt-8 max-w-5xl mx-auto">
          <div className="glass-panel p-6 sm:p-8 bg-gradient-to-b from-slate-900/90 to-slate-950/90 border-slate-800 rounded-2xl relative overflow-hidden shadow-2xl shadow-blue-500/5">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-left relative z-10">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="text-xs text-slate-500 font-medium">Backend Engine</div>
                <div className="text-lg font-bold text-slate-100 mt-1">Django 5.1</div>
                <div className="text-xs text-blue-400 mt-0.5">REST Framework 3.15</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="text-xs text-slate-500 font-medium">Relational DB</div>
                <div className="text-lg font-bold text-slate-100 mt-1">PostgreSQL 16</div>
                <div className="text-xs text-emerald-400 mt-0.5">Persistent Volume</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="text-xs text-slate-500 font-medium">Frontend SPA</div>
                <div className="text-lg font-bold text-slate-100 mt-1">React 18 + TS</div>
                <div className="text-xs text-teal-400 mt-0.5">Vite & Tailwind CSS</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="text-xs text-slate-500 font-medium">Orchestration</div>
                <div className="text-lg font-bold text-slate-100 mt-1">Docker Compose</div>
                <div className="text-xs text-purple-400 mt-0.5">Health Probes Active</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Overview Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <Badge variant="teal">Enterprise Architecture</Badge>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Engineered for Resilient Logistics Operations
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Phase 0 establishes the strict software architecture, automated CI/CD testing baseline, and containerized
            networking required before any commercial freight modules are introduced.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card hoverable className="space-y-4">
            <div className="w-10 h-10 rounded-lg bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-100">Zero-Compromise Security</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Minimal custom AbstractUser model instantiated prior to initial migration. Ready for tenant-scoped
              RBAC authorization, strict CORS policies, and audited endpoints.
            </p>
          </Card>

          <Card hoverable className="space-y-4">
            <div className="w-10 h-10 rounded-lg bg-teal-600/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-100">Deterministic Health Probes</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every container features live liveness and database readiness probes. Health checks verify real
              PostgreSQL round-trip query latency rather than static process flags.
            </p>
          </Card>

          <Card hoverable className="space-y-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Boxes className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-100">Clean OpenAPI 3.0 Contract</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Integrated DRF Spectacular schemas and Swagger UI documentation provide end-to-end type safety and
              predictable client integration across web and mobile.
            </p>
          </Card>
        </div>
      </section>

      {/* Planned Feature Roadmap Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <Badge variant="info">Platform Capabilities & Roadmap</Badge>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Live Modules & Future Capabilities
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Track currently live multi-tenant capabilities alongside upcoming operational milestones:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plannedFeatures.map((feat) => (
            <div
              key={feat.title}
              className="glass-panel p-6 bg-slate-900/40 border-slate-800/80 rounded-xl space-y-3 relative group hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                  {feat.icon}
                </div>
                <Badge variant="neutral" size="sm">
                  {feat.phase}
                </Badge>
              </div>
              <h3 className="text-sm font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">
                {feat.title}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">{feat.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel p-8 sm:p-12 text-center space-y-6 bg-gradient-to-r from-blue-950/40 via-slate-900/60 to-teal-950/40 border-blue-500/20 rounded-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Inspect System Health & Development Environment
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Test the live backend `/api/v1/health/` probe, view PostgreSQL query latency, and verify container networking.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/app/status">
              <Button size="md" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Go to Development Status Page
              </Button>
            </Link>
            <Link to="/app/architecture">
              <Button size="md" variant="secondary">
                View Agile Phase Tracker
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
