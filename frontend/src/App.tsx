import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { HealthStatusCard } from './components/HealthStatusCard';
import { StatusBadge } from './components/StatusBadge';
import { fetchHealthStatus, fetchPlatformInfo } from './services/api';
import { HealthStatus, PlatformInfo, TenantContext, ShipmentStatusType } from './types';
import {
  Layers,
  Lock,
  Activity,
  CheckCircle2,
} from 'lucide-react';

const INITIAL_TENANTS: TenantContext[] = [
  { id: 'ten-global-logistics', name: 'Global Logistics 3PL Corp', code: 'GL3PL', type: '3PL_PROVIDER' },
  { id: 'ten-apex-freight', name: 'Apex Freightways Ltd', code: 'APEX', type: 'CARRIER' },
  { id: 'ten-nordic-retail', name: 'Nordic Retail Supply', code: 'NRS', type: 'SHIPPER' },
];

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeTenant, setActiveTenant] = useState<TenantContext>(INITIAL_TENANTS[0]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(true);

  const loadTelemetry = useCallback(async () => {
    setLoadingHealth(true);
    try {
      const [h, p] = await Promise.all([fetchHealthStatus(), fetchPlatformInfo()]);
      setHealth(h);
      setPlatformInfo(p);
    } catch (err) {
      console.error('Failed to load telemetry:', err);
    } finally {
      setLoadingHealth(false);
    }
  }, []);

  useEffect(() => {
    loadTelemetry();
    const interval = setInterval(loadTelemetry, 15000);
    return () => clearInterval(interval);
  }, [loadTelemetry]);

  const allStatuses: ShipmentStatusType[] = [
    'DRAFT',
    'BOOKED',
    'DISPATCHED',
    'IN_TRANSIT',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'EXCEPTION',
    'CANCELLED',
  ];

  return (
    <div className="app-container">
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          setMobileOpen(false);
        }}
        tenant={activeTenant}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="main-content">
        <Header
          onToggleMobileMenu={() => setMobileOpen(!mobileOpen)}
          health={health}
          tenant={activeTenant}
          onSelectTenant={setActiveTenant}
          availableTenants={INITIAL_TENANTS}
        />

        <main className="page-body">
          {/* Real-time Health Telemetry */}
          <HealthStatusCard
            health={health}
            loading={loadingHealth}
            onRefresh={loadTelemetry}
          />

          {/* Section: Architectural Blueprint & Gate Status */}
          <div className="cards-grid">
            {/* System Architecture */}
            <div className="glass-card" id="card-architecture">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                <Layers size={20} color="#3b82f6" />
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>System Architecture & Stack</h3>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Backend Framework:</span>
                  <span style={{ fontWeight: 600 }}>Django 5.0 + REST Framework 3.15</span>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Frontend SPA:</span>
                  <span style={{ fontWeight: 600 }}>React 18 + TypeScript + Vite</span>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Primary Database:</span>
                  <span style={{ fontWeight: 600 }}>PostgreSQL 16 (psycopg 3)</span>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Container Engine:</span>
                  <span style={{ fontWeight: 600 }}>Docker Compose v2</span>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Tenant Isolation:</span>
                  <span style={{ fontWeight: 600, color: '#34d399' }}>Row-Level Tenant Scoping</span>
                </li>
              </ul>
            </div>

            {/* Role & Permissions Baseline */}
            <div className="glass-card" id="card-rbac">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                <Lock size={20} color="#6366f1" />
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>RBAC Actors & Access Control</h3>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                {platformInfo?.architecture?.roles ? (
                  platformInfo.architecture.roles.map((role) => (
                    <span
                      key={role}
                      style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(99, 102, 241, 0.15)',
                        color: '#a5b4fc',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      {role}
                    </span>
                  ))
                ) : (
                  ['SUPER_ADMIN', 'TENANT_ADMIN', 'LOGISTICS_MANAGER', 'DISPATCHER', 'DRIVER', 'AUDITOR_VIEWER'].map((role) => (
                    <span
                      key={role}
                      style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(99, 102, 241, 0.15)',
                        color: '#a5b4fc',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      {role}
                    </span>
                  ))
                )}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Backend enforces authorization checks via DRF permission classes. No frontend-only security assumptions.
              </p>
            </div>

            {/* Design Tokens & Status Badges */}
            <div className="glass-card" id="card-design-system">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                <Activity size={20} color="#10b981" />
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Shipment Lifecycle States</h3>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {allStatuses.map((st) => (
                  <StatusBadge key={st} status={st} />
                ))}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Deterministic FSM state machine transitions enforced at database and API levels.
              </p>
            </div>
          </div>

          {/* Phase 00 Acceptance Gate Checklist */}
          <div className="glass-card" id="card-phase0-gate">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <CheckCircle2 size={20} color="#10b981" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Phase 00 Acceptance Gate Verification</h3>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Story ID</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Acceptance Criteria</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Component</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'JetBrains Mono' }}>STORY-00-1</td>
                    <td style={{ padding: '0.75rem 1rem' }}>Actors, business goals, scope, SRS requirements defined</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>Docs / SRS</td>
                    <td style={{ padding: '0.75rem 1rem' }}><span style={{ color: '#10b981', fontWeight: 600 }}>PASS</span></td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'JetBrains Mono' }}>STORY-00-2</td>
                    <td style={{ padding: '0.75rem 1rem' }}>Architecture, initial ER diagram, role-permission matrix, API standards</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>Docs / Architecture</td>
                    <td style={{ padding: '0.75rem 1rem' }}><span style={{ color: '#10b981', fontWeight: 600 }}>PASS</span></td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'JetBrains Mono' }}>STORY-00-3</td>
                    <td style={{ padding: '0.75rem 1rem' }}>Django REST Framework, React + TS + Vite, PostgreSQL 16, Docker Compose, Health endpoint</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>Full-Stack / Docker</td>
                    <td style={{ padding: '0.75rem 1rem' }}><span style={{ color: '#10b981', fontWeight: 600 }}>PASS</span></td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'JetBrains Mono' }}>STORY-00-4</td>
                    <td style={{ padding: '0.75rem 1rem' }}>Responsive design system & shell layout with real health probe</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>Frontend SPA</td>
                    <td style={{ padding: '0.75rem 1rem' }}><span style={{ color: '#10b981', fontWeight: 600 }}>PASS</span></td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'JetBrains Mono' }}>STORY-00-5</td>
                    <td style={{ padding: '0.75rem 1rem' }}>Test runners, comprehensive documentation structure, Phase 00 completion report</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>QA & Docs</td>
                    <td style={{ padding: '0.75rem 1rem' }}><span style={{ color: '#10b981', fontWeight: 600 }}>PASS</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
