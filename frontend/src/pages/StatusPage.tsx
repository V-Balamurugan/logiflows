import React from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  Database,
  ExternalLink,
  Layers,
  RefreshCw,
  Server,
  Terminal,
  XCircle,
  FileCode,
  ShieldCheck,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { useHealthQuery, useReadinessQuery, usePlatformInfoQuery } from '../api/health';

export const StatusPage: React.FC = () => {
  const {
    data: health,
    isLoading: loadingHealth,
    isError: errorHealth,
    refetch: refetchHealth,
    dataUpdatedAt: healthUpdated,
  } = useHealthQuery(10000);

  const {
    data: readiness,
    isLoading: loadingReadiness,
    refetch: refetchReadiness,
  } = useReadinessQuery(10000);

  const { data: platformInfo } = usePlatformInfoQuery();

  const handleRefreshAll = () => {
    refetchHealth();
    refetchReadiness();
  };

  const isHealthy = health?.status === 'healthy';
  const isDbConnected = health?.components?.database?.connected ?? readiness?.ready ?? false;
  const dbLatency = health?.components?.database?.latency_ms ?? readiness?.database?.latency_ms ?? null;

  return (
    <div className="space-y-8">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-blue-500" />
            <span>Development Status & Telemetry</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time verification probes connecting frontend, Django REST API, and PostgreSQL database.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            isLoading={loadingHealth || loadingReadiness}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={handleRefreshAll}
          >
            Probe Now
          </Button>
          <a
            href="http://localhost:8000/api/v1/docs/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 px-3 py-2 rounded-lg border border-blue-500/30 bg-blue-500/10 font-medium"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Open Swagger UI</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Primary Status Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Backend API Service */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-blue-400" />
              <CardTitle>Django REST API</CardTitle>
            </div>
            <Badge variant={isHealthy ? 'success' : errorHealth ? 'error' : 'warning'} dot>
              {isHealthy ? 'Healthy' : errorHealth ? 'Unreachable' : 'Checking'}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Endpoint:</span>
              <span className="font-mono text-slate-200">/api/v1/health/</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Framework:</span>
              <span className="text-slate-200">{health?.components?.api?.framework || 'Django 5.1 / DRF'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Service Version:</span>
              <span className="font-mono text-slate-200">{health?.version || '1.0.0-phase-00'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Last Verified:</span>
              <span className="text-slate-400">
                {healthUpdated ? new Date(healthUpdated).toLocaleTimeString() : 'Pending'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* PostgreSQL Database */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <CardTitle>PostgreSQL 16</CardTitle>
            </div>
            <Badge variant={isDbConnected ? 'success' : 'error'} dot>
              {isDbConnected ? 'Connected' : 'Offline'}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Readiness Probe:</span>
              <span className="font-mono text-slate-200">/api/v1/readiness/</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Query Latency:</span>
              <span className="font-mono text-emerald-400">
                {dbLatency !== null ? `${dbLatency} ms` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Engine:</span>
              <span className="text-slate-200">
                {health?.components?.database?.engine || 'postgresql'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Test Query:</span>
              <span className="font-mono text-slate-400">SELECT 1;</span>
            </div>
          </CardContent>
        </Card>

        {/* Application Environment */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-teal-400" />
              <CardTitle>App Environment</CardTitle>
            </div>
            <Badge variant="teal">Phase 00</Badge>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Environment Mode:</span>
              <span className="font-semibold text-slate-200 capitalize">
                {health?.environment || 'Development'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">User Model:</span>
              <span className="text-slate-200">AbstractUser (apps.users)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">CORS Policy:</span>
              <span className="text-slate-200">Origin-Filtered (Local Dev)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">OpenAPI Spec:</span>
              <span className="text-blue-400">drf-spectacular v0.27</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Development Setup & Operational Guide */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-slate-400" />
            <div>
              <CardTitle>Docker & Local Development Architecture</CardTitle>
              <CardDescription>
                Verification commands and container networking configuration.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 bg-slate-950/80 rounded-lg border border-slate-800 space-y-2">
              <div className="text-xs font-semibold text-slate-300">Docker Compose Services</div>
              <ul className="text-xs space-y-1.5 text-slate-400">
                <li className="flex items-center justify-between">
                  <span className="font-mono text-slate-200">logiflows_db</span>
                  <span className="text-slate-500">PostgreSQL 16 (Port 5432)</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="font-mono text-slate-200">logiflows_backend</span>
                  <span className="text-slate-500">Django Gunicorn/Runserver (Port 8000)</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="font-mono text-slate-200">logiflows_frontend</span>
                  <span className="text-slate-500">Vite Dev / Nginx (Port 3000)</span>
                </li>
              </ul>
            </div>

            <div className="p-3.5 bg-slate-950/80 rounded-lg border border-slate-800 space-y-2">
              <div className="text-xs font-semibold text-slate-300">Execution Commands</div>
              <div className="space-y-1 font-mono text-[11px] text-slate-400">
                <div className="text-slate-300"># Start complete container stack</div>
                <div className="text-blue-400 bg-slate-900 px-2 py-1 rounded">docker compose up --build</div>
                <div className="text-slate-300 pt-1"># Execute automated tests</div>
                <div className="text-teal-400 bg-slate-900 px-2 py-1 rounded">pytest (Backend) | npm test (Frontend)</div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-blue-950/20 border border-blue-500/20 rounded-lg text-xs text-slate-300 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-semibold text-slate-200">Phase 0 Gate Compliance:</span> Real-time data
              from <span className="font-mono text-blue-400">/api/v1/health/</span> and <span className="font-mono text-blue-400">/api/v1/readiness/</span> is
              probed live. Zero fabricated operational rows (such as fake parcels or dummy vehicles) are rendered as actual data.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatusPage;
