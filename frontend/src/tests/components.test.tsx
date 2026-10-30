import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import Toast from '../components/ui/Toast';
import Logo from '../components/common/Logo';
import Breadcrumbs from '../components/common/Breadcrumbs';

describe('UI & Common Components Test Suite', () => {
  describe('Button Component', () => {
    it('renders with default primary variant', () => {
      render(<Button>Click Me</Button>);
      const btn = screen.getByRole('button', { name: /click me/i });
      expect(btn).toBeInTheDocument();
      expect(btn).toHaveClass('bg-blue-600');
    });

    it('renders disabled state when isLoading is true', () => {
      render(<Button isLoading>Submit</Button>);
      const btn = screen.getByRole('button');
      expect(btn).toBeDisabled();
    });

    it('renders different variants and sizes', () => {
      const { rerender } = render(<Button variant="secondary" size="sm">Secondary</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-slate-800');

      rerender(<Button variant="outline" size="lg">Outline</Button>);
      expect(screen.getByRole('button')).toHaveClass('border-blue-500/40');

      rerender(<Button variant="teal">Teal Action</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-teal-600');
    });
  });

  describe('Badge Component', () => {
    it('renders success, warning, error, teal, and neutral badges', () => {
      const { rerender } = render(<Badge variant="success">Active</Badge>);
      expect(screen.getByText('Active')).toHaveClass('text-emerald-400');

      rerender(<Badge variant="warning">Pending</Badge>);
      expect(screen.getByText('Pending')).toHaveClass('text-amber-400');

      rerender(<Badge variant="error">Offline</Badge>);
      expect(screen.getByText('Offline')).toHaveClass('text-rose-400');

      rerender(<Badge variant="teal">Staged</Badge>);
      expect(screen.getByText('Staged')).toHaveClass('text-teal-400');
    });
  });

  describe('Card Component', () => {
    it('renders card title, content and footer structure', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>System Header</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Main Card Body</p>
          </CardContent>
          <CardFooter>
            <span>Footer Note</span>
          </CardFooter>
        </Card>
      );
      expect(screen.getByText('System Header')).toBeInTheDocument();
      expect(screen.getByText('Main Card Body')).toBeInTheDocument();
      expect(screen.getByText('Footer Note')).toBeInTheDocument();
    });
  });

  describe('Input Component', () => {
    it('renders input with label, placeholder, and helper text', () => {
      render(
        <Input
          label="Postal Code"
          placeholder="10001"
          helperText="5-digit ZIP"
        />
      );
      expect(screen.getByLabelText(/postal code/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('10001')).toBeInTheDocument();
      expect(screen.getByText('5-digit ZIP')).toBeInTheDocument();
    });

    it('renders error state and message correctly', () => {
      render(
        <Input
          label="Email Address"
          error="Invalid corporate email format"
        />
      );
      expect(screen.getByText('Invalid corporate email format')).toBeInTheDocument();
      const input = screen.getByLabelText(/email address/i);
      expect(input).toHaveClass('border-rose-500/80');
    });
  });

  describe('Select Component', () => {
    it('renders select with options and handles selection change', () => {
      const handleChange = vi.fn();
      render(
        <Select
          label="Carrier Hub"
          onChange={handleChange}
          options={[
            { value: 'hub-1', label: 'JFK Central' },
            { value: 'hub-2', label: 'LAX Regional' },
          ]}
        />
      );
      const select = screen.getByLabelText(/carrier hub/i);
      expect(select).toBeInTheDocument();
      expect(screen.getByText('JFK Central')).toBeInTheDocument();

      fireEvent.change(select, { target: { value: 'hub-2' } });
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('Table Component', () => {
    it('renders semantic table structure with rows and cells', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tracking ID</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>LF-1001</TableCell>
              <TableCell>Dispatched</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByText('Tracking ID')).toBeInTheDocument();
      expect(screen.getByText('LF-1001')).toBeInTheDocument();
      expect(screen.getByText('Dispatched')).toBeInTheDocument();
    });
  });

  describe('Modal Component', () => {
    it('renders modal dialog when isOpen is true and triggers onClose', () => {
      const handleClose = vi.fn();
      const { rerender } = render(
        <Modal isOpen={true} onClose={handleClose} title="Custody Transfer">
          <p>Confirm transfer modal body</p>
        </Modal>
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Custody Transfer')).toBeInTheDocument();
      expect(screen.getByText('Confirm transfer modal body')).toBeInTheDocument();

      const closeBtn = screen.getByRole('button', { name: /close dialog/i });
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);

      rerender(
        <Modal isOpen={false} onClose={handleClose} title="Custody Transfer">
          <p>Confirm transfer modal body</p>
        </Modal>
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Spinner Component', () => {
    it('renders accessible loading spinner with role status', () => {
      render(<Spinner size="md" label="Loading telemetry..." />);
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
      expect(screen.getByText('Loading telemetry...')).toBeInTheDocument();
    });
  });

  describe('EmptyState & ErrorState Components', () => {
    it('renders EmptyState with action button', () => {
      const handleAction = vi.fn();
      render(
        <EmptyState
          title="No Shipments"
          description="Your dispatch queue is currently empty."
          actionLabel="Create Consignment"
          onAction={handleAction}
        />
      );
      expect(screen.getByText('No Shipments')).toBeInTheDocument();
      const actionBtn = screen.getByRole('button', { name: /create consignment/i });
      fireEvent.click(actionBtn);
      expect(handleAction).toHaveBeenCalledTimes(1);
    });

    it('renders ErrorState with retry trigger', () => {
      const handleRetry = vi.fn();
      render(
        <ErrorState
          title="Network Connection Failed"
          message="Could not reach PostgreSQL database."
          onRetry={handleRetry}
        />
      );
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Network Connection Failed')).toBeInTheDocument();
      const retryBtn = screen.getByRole('button', { name: /retry request/i });
      fireEvent.click(retryBtn);
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('Toast Component', () => {
    it('renders notification toast with dismiss button', () => {
      const handleClose = vi.fn();
      render(
        <Toast
          type="success"
          title="Consignment Saved"
          message="Waybill created successfully."
          onClose={handleClose}
        />
      );
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Consignment Saved')).toBeInTheDocument();
      const closeBtn = screen.getByRole('button', { name: /dismiss toast/i });
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Logo and Breadcrumbs Components', () => {
    it('renders LogiFlows brand text within Router', () => {
      render(
        <MemoryRouter>
          <Logo size="lg" />
        </MemoryRouter>
      );
      expect(screen.getByText('Logi')).toBeInTheDocument();
      expect(screen.getByText('Flows')).toBeInTheDocument();
    });

    it('renders breadcrumb items and separators', () => {
      render(
        <MemoryRouter>
          <Breadcrumbs items={[{ label: 'Home', path: '/' }, { label: 'Status' }]} />
        </MemoryRouter>
      );
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });
  });
});
