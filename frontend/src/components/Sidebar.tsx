import React from 'react';
import {
  LayoutDashboard,
  Package,
  Truck,
  Receipt,
  Building2,
  ShieldCheck,
  Settings,
  Boxes,
  Layers,
} from 'lucide-react';
import { TenantContext } from '../types';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  tenant: TenantContext;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  tenant,
  mobileOpen,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Platform Overview', icon: LayoutDashboard },
    { id: 'shipments', label: 'Shipments & Freight', icon: Package },
    { id: 'fleet', label: 'Fleet & Carriers', icon: Truck },
    { id: 'invoicing', label: 'Invoices & Billing', icon: Receipt },
    { id: 'tenants', label: 'Organizations & RBAC', icon: Building2 },
    { id: 'architecture', label: 'Architecture & Models', icon: Layers },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`} id="main-sidebar">
      <div className="sidebar-header">
        <div className="logo-wrapper">
          <div className="logo-icon">
            <Boxes size={22} color="#ffffff" />
          </div>
          <div>
            <div className="logo-text">LogiFlows</div>
          </div>
        </div>
        <span className="logo-tag">B2B Core</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => onNavigate(item.id)}
              className={`nav-item ${isActive ? 'active' : ''}`}
              style={{
                width: '100%',
                background: isActive ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                textAlign: 'left',
              }}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="tenant-badge" id="tenant-context-display">
          <div className="tenant-label">Active B2B Tenant</div>
          <div className="tenant-name">{tenant.name}</div>
          <div style={{ fontSize: '0.7rem', color: '#60a5fa', marginTop: '2px' }}>
            {tenant.type} · {tenant.code}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          <ShieldCheck size={14} color="#10b981" />
          <span>PostgreSQL Isolation Enforced</span>
        </div>
      </div>
    </aside>
  );
};
