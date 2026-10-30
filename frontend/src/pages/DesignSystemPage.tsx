import React, { useState } from 'react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import Toast from '../components/ui/Toast';
import { Mail, Search, Send, CheckCircle2, Shield, AlertTriangle } from 'lucide-react';

export const DesignSystemPage: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectValue, setSelectValue] = useState('hub-ny');

  return (
    <div className="space-y-12 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="teal">Dev Only Showcase</Badge>
          <Badge variant="default">Phase 00</Badge>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Enterprise Design System & Tokens</h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Complete component inventory showcasing all variants, states, interactive triggers, and typography tokens.
        </p>
      </div>

      {/* 1. Color Palette Tokens */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white border-b border-slate-800 pb-2">1. Color Palette Tokens</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="h-10 rounded-lg bg-[#070d19] border border-slate-800 mb-2" />
            <p className="text-xs font-semibold text-white">LogiFlows Navy</p>
            <p className="text-[11px] text-slate-400 font-mono">#070d19 / slate-950</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="h-10 rounded-lg bg-blue-600 mb-2" />
            <p className="text-xs font-semibold text-white">Enterprise Blue</p>
            <p className="text-[11px] text-slate-400 font-mono">#2563eb / blue-600</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="h-10 rounded-lg bg-teal-600 mb-2" />
            <p className="text-xs font-semibold text-white">Restrained Teal</p>
            <p className="text-[11px] text-slate-400 font-mono">#0d9488 / teal-600</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="h-10 rounded-lg bg-slate-800 border border-slate-700 mb-2" />
            <p className="text-xs font-semibold text-white">Surface Slate</p>
            <p className="text-[11px] text-slate-400 font-mono">#1e293b / slate-800</p>
          </div>
        </div>
      </section>

      {/* 2. Buttons */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white border-b border-slate-800 pb-2">2. Buttons & Actions</h2>
        <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-6">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Variants</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Primary Action</Button>
              <Button variant="secondary">Secondary Action</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost Action</Button>
              <Button variant="teal">Teal Accent</Button>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Sizes & Icons</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm" leftIcon={<Send className="w-3.5 h-3.5" />}>Small Icon</Button>
              <Button size="md" rightIcon={<CheckCircle2 className="w-4 h-4" />}>Medium Icon</Button>
              <Button size="lg" leftIcon={<Shield className="w-5 h-5" />}>Large Button</Button>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Interactive States</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button isLoading>Processing...</Button>
              <Button disabled>Disabled Button</Button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Form Inputs & Select */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white border-b border-slate-800 pb-2">3. Form Controls</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-xl bg-slate-900/60 border border-slate-800">
          <Input
            label="Consignment Tracking ID"
            placeholder="e.g. LF-8921-X9"
            helperText="Enter 10-character postal tracking number"
            leftIcon={<Search className="w-4 h-4" />}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />

          <Input
            label="Validated Dispatch Email"
            placeholder="dispatcher@logiflows.com"
            error="Please provide a valid logistics corporate email"
            leftIcon={<Mail className="w-4 h-4" />}
            defaultValue="invalid-format@"
          />

          <Select
            label="Dispatch Sorting Hub"
            helperText="Select the origin handling facility"
            value={selectValue}
            onChange={(e) => setSelectValue(e.target.value)}
            options={[
              { value: 'hub-ny', label: 'JFK Central Distribution Hub — NY' },
              { value: 'hub-ord', label: "O'Hare Logistics Air Cargo — IL" },
              { value: 'hub-lax', label: 'LAX Regional Sorting Center — CA' },
              { value: 'hub-sea', label: 'SeaTac NorthWest Hub — WA (Disabled)', disabled: true },
            ]}
          />

          <Input
            label="Locked System Variable"
            value="UUIDv4-AUTO-GENERATED"
            disabled
            helperText="Field is read-only in this role"
          />
        </div>
      </section>

      {/* 4. Badges */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white border-b border-slate-800 pb-2">4. Badges & Tags</h2>
        <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap gap-3">
          <Badge variant="default">Default Blue</Badge>
          <Badge variant="teal">Teal Restrained</Badge>
          <Badge variant="neutral">Neutral Slate</Badge>
          <Badge variant="success">Operational Success</Badge>
          <Badge variant="warning">Transit Delay Risk</Badge>
          <Badge variant="error">Critical Exception</Badge>
        </div>
      </section>

      {/* 5. Tables */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white border-b border-slate-800 pb-2">5. Data Table</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Consignment</TableHead>
              <TableHead>Origin / Destination</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Carrier</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-mono text-xs text-blue-400">LF-2026-901</TableCell>
              <TableCell>JFK Airport → Chicago Hub</TableCell>
              <TableCell><Badge variant="success" size="sm">In Transit</Badge></TableCell>
              <TableCell>SwiftCargo 3PL</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-mono text-xs text-blue-400">LF-2026-902</TableCell>
              <TableCell>LAX Logistics → Seattle Hub</TableCell>
              <TableCell><Badge variant="warning" size="sm">Weather Hold</Badge></TableCell>
              <TableCell>PacificFreight</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-mono text-xs text-blue-400">LF-2026-903</TableCell>
              <TableCell>Atlanta Hub → Miami Gateway</TableCell>
              <TableCell><Badge variant="teal" size="sm">Staged</Badge></TableCell>
              <TableCell>MetroDispatch</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>

      {/* 6. Feedback & States (Spinner, Toast, Empty, Error) */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white border-b border-slate-800 pb-2">6. Feedback & Notification States</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Toasts</p>
            <Toast type="info" title="System Notice" message="Nightly routing cache warming scheduled at 02:00 UTC." />
            <Toast type="success" title="Custody Accepted" message="Digital QR custody signature verified for container C-991." />
            <Toast type="warning" title="Telemetry Degraded" message="GPS update delayed for Carrier Unit #12." />
            <Toast type="error" title="Ingress Error" message="Database connection refused on replica node." />
          </div>

          <div className="space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Spinners & Modals</p>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-6">
              <Spinner size="sm" />
              <Spinner size="md" />
              <Spinner size="lg" />
              <Button size="sm" variant="outline" onClick={() => setModalOpen(true)}>
                Open Demonstration Modal
              </Button>
            </div>

            <ErrorState
              title="PostgreSQL Readiness Exception"
              message="Failed to execute SELECT 1; probe on replica connection pool."
              onRetry={() => alert('Retrying connection...')}
            />
          </div>
        </div>
      </section>

      {/* 7. Empty State Showcase */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white border-b border-slate-800 pb-2">7. Empty State</h2>
        <EmptyState
          title="No Active Consignments"
          description="There are currently no parcels booked for this branch dispatch queue."
          actionLabel="Refresh Queue"
          onAction={() => alert('Queue refreshed.')}
        />
      </section>

      {/* Modal Dialog Instance */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Enterprise Security Validation"
        description="Verify cryptographic signature for custody transfer"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={() => setModalOpen(false)}>
              Confirm Custody
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-300 leading-relaxed">
          LogiFlows verifies that all state changes adhere to strict tenant-level access control.
          Custody handoffs are cryptographically signed and immutable.
        </p>
      </Modal>
    </div>
  );
};

export default DesignSystemPage;
