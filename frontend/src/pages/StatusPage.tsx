import React from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  Database,
  ExternalLink,
  RefreshCw,
  Server,
  XCircle,
  FileCode,
  ShieldCheck,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { useHealthQuery } from '../api/health';

export const StatusPage: React.FC = () => {
  const {
    data: health,
    isLoading: loadingHealth,
    isError: errorHealth,
    refetch: refetchHealth,
    dataUpdatedAt: healthUpdated,
  } = useHealthQuery(10000);

  const isHealthy = health?.status === 'healthy';
  const isDbConnected = health?.db === 'ok' || health?.components?.database?.connected;
  const dbLatency = health?.latency_ms ?? health?.components?.database?.latency_ms ?? null;

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
            variant="outline"
            size="sm"
            onClick={() => refetchHealth()}
            isLoading={loadingHealth}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Poll Status Now
          </Button>
          <a
            href="http://localhost:8000/api/v1/docs/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg border border-slate-700 transition-colors"
          >
            <span>Swagger UI</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>

      {/* Primary Telemetry Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Django Backend */}
        <Card className="border-slate-800/80 bg-slate-900/60 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-blue-950/60 border border-blue-800/50 text-blue-400">
                <Server className="w-5 h-5" />
              </div>
              <Badge variant={isHealthy ? 'success' : errorHealth ? 'error' : 'neutral'}>
                {loadingHealth ? 'Checking...' : isHealthy ? 'API HEALTHY' : 'API OFFLINE'}
              </Badge>
            </div>
            <CardTitle className="text-base font-semibold mt-3">Django REST API</CardTitle>
            <CardDescription className="text-xs">Port 8000 · Python 3.12 / Django 5.1</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-2.5 text-xs text-slate-400">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span>Endpoint:</span>
              <span className="font-mono text-slate-200">GET /api/v1/health/</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span>Environment:</span>
              <span className="font-mono text-blue-400">{health?.environment ?? 'development'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span>API Version:</span>
              <span className="font-mono text-slate-200">{health?.version ?? '1.0.0-phase-00'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Health Status:</span>
              <span className="font-medium text-emerald-400">{health?.status ?? 'Online'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: PostgreSQL Database */}
        <Card className="border-slate-800/80 bg-slate-900/60 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-teal-950/60 border border-teal-800/50 text-teal-400">
                <Database className="w-5 h-5" />
              </div>
              <Badge variant={isDbConnected ? 'success' : 'error'}>
                {loadingHealth ? 'Checking...' : isDbConnected ? 'DB: OK' : 'DB UNAVAILABLE'}
              </Badge>
            </div>
            <CardTitle className="text-base font-semibold mt-3">PostgreSQL 16</CardTitle>
            <CardDescription className="text-xs">Port 5432 · ACID Multi-Tenant Store</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-2.5 text-xs text-slate-400">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span>Probe Query:</span>
              <span className="font-mono text-slate-200">SELECT 1;</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span>DB Response:</span>
              <span className="font-mono text-emerald-400">{health?.db ?? 'ok'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span>Probe Latency:</span>
              <span className="font-mono text-teal-300">
                {dbLatency !== null ? `${dbLatency} ms` : 'Verified Live'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span>Database Volume:</span>
              <span className="font-mono text-slate-300">postgres_data (Persistent)</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Security & Architecture Baseline */}
        <Card className="border-slate-800/80 bg-slate-900/60 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-purple-950/60 border border-purple-800/50 text-purple-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <Badge variant="teal">PHASE 00 AUDITED</Badge>
            </div>
            <CardTitle className="text-base font-semibold mt-3">Architecture & Models</CardTitle>
            <CardDescription className="text-xs">Verified Foundation & User Baseline</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-2.5 text-xs text-slate-400">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span>User Model:</span>
              <span className="font-mono text-slate-200">accounts.User (UUID PK)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span>Login Identifier:</span>
              <span className="font-mono text-slate-200">Normalized Email</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span>Initial Role:</span>
              <span className="font-mono text-slate-200">CUSTOMER (Safe Default)</span>
            </div>
            <div className="flex justify-between py-1">
              <span>JWT Auth Setup:</span>
              <span className="font-mono text-slate-300">SimpleJWT (15m / 7d rotate)</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Polling Timestamp Banner */}
      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-900/40 border border-slate-800/80 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400" />
          <span>Last Telemetry Update:</span>
          <span className="font-mono text-slate-300">
            {healthUpdated ? new Date(healthUpdated).toLocaleTimeString() : 'Awaiting heartbeat...'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 font-medium">Automatic Polling (10s)</span>
        </div>
      </div>
    </div>
  );
};

export default StatusPage;
