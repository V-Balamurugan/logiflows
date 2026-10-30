import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import Input from '../components/ui/Input';
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
    });
  });

  describe('Badge Component', () => {
    it('renders success, warning, error, and neutral badges', () => {
      const { rerender } = render(<Badge variant="success">Active</Badge>);
      expect(screen.getByText('Active')).toHaveClass('text-emerald-400');

      rerender(<Badge variant="warning">Pending</Badge>);
      expect(screen.getByText('Pending')).toHaveClass('text-amber-400');

      rerender(<Badge variant="error">Offline</Badge>);
      expect(screen.getByText('Offline')).toHaveClass('text-rose-400');
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
    it('renders label and error message', () => {
      render(<Input label="Tracking Number" error="Invalid format" placeholder="Enter code" />);
      expect(screen.getByLabelText(/tracking number/i)).toBeInTheDocument();
      expect(screen.getByText(/invalid format/i)).toBeInTheDocument();
    });
  });

  describe('Logo Component', () => {
    it('renders LogiFlows brand text within Router', () => {
      render(
        <MemoryRouter>
          <Logo />
        </MemoryRouter>
      );
      expect(screen.getByText('Logi')).toBeInTheDocument();
      expect(screen.getByText('Flows')).toBeInTheDocument();
    });
  });

  describe('Breadcrumbs Component', () => {
    it('renders breadcrumb items correctly', () => {
      render(
        <MemoryRouter>
          <Breadcrumbs items={[{ label: 'Operations', path: '/ops' }, { label: 'Status' }]} />
        </MemoryRouter>
      );
      expect(screen.getByText('Operations')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });
  });
});
