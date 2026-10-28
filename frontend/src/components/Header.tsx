import React from 'react';
import { Menu, Bell, CheckCircle2, AlertCircle } from 'lucide-react';
import { HealthStatus, TenantContext } from '../types';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  health: HealthStatus | null;
  tenant: TenantContext;
  onSelectTenant: (tenant: TenantContext) => void;
  availableTenants: TenantContext[];
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  health,
  tenant,
  onSelectTenant,
  availableTenants,
}) => {
  const isHealthy = health?.status === 'healthy';

  return (
    <header className="header" id="main-header">
      <div className="header-left">
        <button
          id="btn-mobile-menu-toggle"
          className="menu-toggle-btn"
          onClick={onToggleMobileMenu}
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={20} />
        </button>
        <div className="header-title-section">
          <h1>LogiFlows Enterprise Logistics</h1>
          <p>Phase 00: Foundation, Architecture & Docker Baseline</p>
        </div>
      </div>

      <div className="header-actions">
        {/* Tenant Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label htmlFor="tenant-select" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Tenant:
          </label>
          <select
            id="tenant-select"
            value={tenant.id}
            onChange={(e) => {
              const selected = availableTenants.find((t) => t.id === e.target.value);
              if (selected) onSelectTenant(selected);
            }}
            style={{
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.4rem 0.75rem',
              fontSize: '0.825rem',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {availableTenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.type})
              </option>
            ))}
          </select>
        </div>

        {/* Live Health Pill */}
        <div
          id="header-health-indicator"
          className={`status-pill ${isHealthy ? 'status-healthy' : 'status-error'}`}
          title={isHealthy ? 'Backend API and Database Online' : 'Infrastructure Degraded'}
        >
          {isHealthy ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
          <span>{isHealthy ? 'POSTGRES LIVE' : 'CONNECTING'}</span>
        </div>

        {/* Notifications */}
        <button
          id="btn-notifications"
          aria-label="Notifications"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '0.4rem',
            borderRadius: 'var(--radius-md)',
            position: 'relative',
          }}
        >
          <Bell size={18} />
          <span
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--brand-primary)',
            }}
          />
        </button>

        {/* User Profile */}
        <div className="user-profile" id="user-profile-badge">
          <div className="user-avatar">AD</div>
          <div className="user-info">
            <span className="user-name">Alex Dawson</span>
            <span className="user-role">Super Admin / Platform Lead</span>
          </div>
        </div>
      </div>
    </header>
  );
};
