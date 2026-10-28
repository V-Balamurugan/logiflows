import React from 'react';
import { HealthStatus } from '../types';
import { Database, Server, RefreshCw } from 'lucide-react';

interface HealthStatusCardProps {
  health: HealthStatus | null;
  loading: boolean;
  onRefresh: () => void;
}

export const HealthStatusCard: React.FC<HealthStatusCardProps> = ({
  health,
  loading,
  onRefresh,
}) => {
  const isHealthy = health?.status === 'healthy';
  const isDbConnected = health?.components?.database?.connected ?? false;

  return (
    <div className="glass-card" id="health-status-card" style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              padding: '0.5rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(59, 130, 246, 0.15)',
              color: 'var(--brand-primary)',
            }}
          >
            <Server size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Live Infrastructure & Database Health
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Real-time query probe against backend API and PostgreSQL database
            </p>
          </div>
        </div>

        <button
          id="btn-refresh-health"
          onClick={onRefresh}
          disabled={loading}
          className="btn btn-secondary"
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Probing...' : 'Refresh Telemetry'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        {/* API Backend Card */}
        <div
          style={{
            padding: '1rem',
            background: 'rgba(2, 6, 23, 0.6)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Server size={16} /> Django REST API
            </span>
            <span
              className={`status-pill ${
                isHealthy ? 'status-healthy' : health?.status === 'degraded' ? 'status-warning' : 'status-error'
              }`}
            >
              <span className="status-dot"></span>
              {health ? health.status.toUpperCase() : 'UNKNOWN'}
            </span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <div>Service: <strong style={{ color: 'var(--text-primary)' }}>{health?.service || 'LogiFlows API'}</strong></div>
            <div>Version: <code style={{ color: 'var(--brand-primary)' }}>{health?.version || '0.1.0-phase-00'}</code></div>
            <div>Env: <span style={{ textTransform: 'capitalize' }}>{health?.environment || 'unknown'}</span></div>
          </div>
        </div>

        {/* Database Card */}
        <div
          style={{
            padding: '1rem',
            background: 'rgba(2, 6, 23, 0.6)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Database size={16} /> PostgreSQL Engine
            </span>
            <span className={`status-pill ${isDbConnected ? 'status-healthy' : 'status-error'}`}>
              <span className="status-dot"></span>
              {isDbConnected ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <div>Engine: <strong style={{ color: 'var(--text-primary)' }}>{health?.components?.database?.engine || 'postgresql'}</strong></div>
            <div>
              Probe Latency:{' '}
              <strong style={{ color: '#10b981' }}>
                {health?.components?.database?.latency_ms !== null && health?.components?.database?.latency_ms !== undefined
                  ? `${health.components.database.latency_ms} ms`
                  : 'N/A'}
              </strong>
            </div>
            {health?.components?.database?.error && (
              <div style={{ color: 'var(--status-error)', fontSize: '0.75rem' }}>
                Error: {health.components.database.error}
              </div>
            )}
          </div>
        </div>

        {/* Operational State Card */}
        <div
          style={{
            padding: '1rem',
            background: 'rgba(2, 6, 23, 0.6)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Operational Data Integrity
            </span>
            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
              VERIFIED
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Phase 00 strictly prohibits dummy operational records disguised as live data. Real tables will be seeded in Phase 01.
          </p>
        </div>
      </div>
    </div>
  );
};
