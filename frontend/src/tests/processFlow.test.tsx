import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProcessFlowStepper from '../components/common/ProcessFlowStepper';

describe('ProcessFlowStepper Component Suite', () => {
  it('renders all 6 operational steps with correct phase badges and titles', () => {
    render(
      <MemoryRouter>
        <ProcessFlowStepper />
      </MemoryRouter>
    );

    // Section title & summary
    expect(screen.getByText('End-to-End Operational Logistics Lifecycle')).toBeInTheDocument();
    expect(screen.getByText('Phase 02: 4/4 Core Stages Live')).toBeInTheDocument();

    // Step numbers
    expect(screen.getByText('Step 01')).toBeInTheDocument();
    expect(screen.getByText('Step 02')).toBeInTheDocument();
    expect(screen.getByText('Step 03')).toBeInTheDocument();
    expect(screen.getByText('Step 04')).toBeInTheDocument();
    expect(screen.getByText('Step 05')).toBeInTheDocument();
    expect(screen.getByText('Step 06')).toBeInTheDocument();

    // Step titles
    expect(screen.getByText('Tenant Identity & Security')).toBeInTheDocument();
    expect(screen.getByText('Branch Hub Facilities')).toBeInTheDocument();
    expect(screen.getByText('Postal Coverage Zones')).toBeInTheDocument();
    expect(screen.getByText('Workforce & Role RBAC')).toBeInTheDocument();
    expect(screen.getByText('Consignment & Waybills')).toBeInTheDocument();
    expect(screen.getByText('Custody & Dispatch')).toBeInTheDocument();

    // Completed steps badge count (4 completed steps)
    const completedBadges = screen.getAllByText('Completed');
    expect(completedBadges).toHaveLength(4);

    // Next phase badge
    expect(screen.getByText('Next Phase')).toBeInTheDocument();

    // Planned roadmap badge
    expect(screen.getByText('Planned')).toBeInTheDocument();
  });

  it('renders platform admin specific action link for organization review queue', () => {
    render(
      <MemoryRouter>
        <ProcessFlowStepper userRole="PLATFORM_ADMIN" />
      </MemoryRouter>
    );

    const reviewLink = screen.getByRole('link', { name: /Review Queue/i });
    expect(reviewLink).toBeInTheDocument();
    expect(reviewLink).toHaveAttribute('href', '/admin/organizations');
  });

  it('renders tenant owner action link for organization settings', () => {
    render(
      <MemoryRouter>
        <ProcessFlowStepper userRole="ORGANIZATION_OWNER" />
      </MemoryRouter>
    );

    const settingsLink = screen.getByRole('link', { name: /View Settings/i });
    expect(settingsLink).toBeInTheDocument();
    expect(settingsLink).toHaveAttribute('href', '/organization/settings');
  });
});
