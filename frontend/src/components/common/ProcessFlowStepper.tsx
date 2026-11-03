import React from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building,
  GitBranch,
  MapPin,
  Users,
  Package,
  Truck,
  Sparkles,
} from 'lucide-react';
import Badge from '../ui/Badge';
import Card from '../ui/Card';

export interface ProcessStep {
  id: string;
  stepNumber: number;
  title: string;
  phase: string;
  status: 'COMPLETED' | 'ACTIVE' | 'NEXT_UP' | 'ROADMAP';
  icon: React.ReactNode;
  description: string;
  actionText?: string;
  actionLink?: string;
  roleScope?: string[];
}

export interface ProcessFlowStepperProps {
  userRole?: string;
  className?: string;
  showAllSteps?: boolean;
}

export const ProcessFlowStepper: React.FC<ProcessFlowStepperProps> = ({
  userRole,
  className = '',
  showAllSteps = true,
}) => {
  const steps: ProcessStep[] = [
    {
      id: 'step-onboarding',
      stepNumber: 1,
      title: 'Tenant Identity & Security',
      phase: 'Phase 01',
      status: 'COMPLETED',
      icon: <Building className="w-5 h-5 text-teal-400" />,
      description: 'Customer registration, email verification, and platform admin approval queue.',
      actionText: userRole === 'PLATFORM_ADMIN' ? 'Review Queue' : 'View Settings',
      actionLink: userRole === 'PLATFORM_ADMIN' ? '/admin/organizations' : '/organization/settings',
    },
    {
      id: 'step-hubs',
      stepNumber: 2,
      title: 'Branch Hub Facilities',
      phase: 'Phase 02',
      status: 'COMPLETED',
      icon: <GitBranch className="w-5 h-5 text-teal-400" />,
      description: 'Physical depot facilities, branch manager assignments, and central hub hierarchy.',
      actionText: 'Manage Hubs',
      actionLink: '/branches',
    },
    {
      id: 'step-serviceability',
      stepNumber: 3,
      title: 'Postal Coverage Zones',
      phase: 'Phase 02',
      status: 'COMPLETED',
      icon: <MapPin className="w-5 h-5 text-teal-400" />,
      description: 'Non-overlapping postal code service areas with real-time delivery route queries.',
      actionText: 'Check Postal Codes',
      actionLink: '/serviceability',
    },
    {
      id: 'step-workforce',
      stepNumber: 4,
      title: 'Workforce & Role RBAC',
      phase: 'Phase 02',
      status: 'COMPLETED',
      icon: <Users className="w-5 h-5 text-teal-400" />,
      description: 'Courier staff provisioning, privilege hierarchy, and branch roster allocation.',
      actionText: 'Manage Staff',
      actionLink: '/employees',
    },
    {
      id: 'step-parcels',
      stepNumber: 5,
      title: 'Consignment & Waybills',
      phase: 'Phase 03',
      status: 'NEXT_UP',
      icon: <Package className="w-5 h-5 text-indigo-400" />,
      description: 'Volumetric rate rating, direct shipment booking, and printable barcode waybills.',
      actionText: 'Phase 03 Next',
    },
    {
      id: 'step-dispatch',
      stepNumber: 6,
      title: 'Custody & Dispatch',
      phase: 'Phase 04-06',
      status: 'ROADMAP',
      icon: <Truck className="w-5 h-5 text-slate-400" />,
      description: 'Fleet vehicle registry, QR chain-of-custody handoffs, and electronic POD.',
      actionText: 'Roadmap',
    },
  ];

  const getStatusBadge = (status: ProcessStep['status']) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success" size="sm">Completed</Badge>;
      case 'ACTIVE':
        return <Badge variant="teal" size="sm">Active</Badge>;
      case 'NEXT_UP':
        return <Badge variant="info" size="sm">Next Phase</Badge>;
      case 'ROADMAP':
        return <Badge variant="neutral" size="sm">Planned</Badge>;
    }
  };

  return (
    <div className={`space-y-4 ${className}`} data-testid="process-flow-stepper">
      {/* Header with completion summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary-600" />
            End-to-End Operational Logistics Lifecycle
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Phased progression: 4 of 6 core operational stages completed and live in production.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="teal" size="sm">
            Phase 02: 4/4 Core Stages Live
          </Badge>
        </div>
      </div>

      {/* Grid of Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {steps.map((step) => {
          const isFinished = step.status === 'COMPLETED';
          const isNext = step.status === 'NEXT_UP';

          return (
            <Card
              key={step.id}
              className={`p-4 transition-all duration-200 flex flex-col justify-between ${
                isFinished
                  ? 'border-emerald-200 bg-emerald-50/20 hover:border-emerald-300'
                  : isNext
                  ? 'border-indigo-300 bg-indigo-50/30 hover:border-indigo-400 shadow-sm'
                  : 'border-gray-200 bg-gray-50/50 opacity-80'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-2 rounded-lg ${
                        isFinished
                          ? 'bg-emerald-100 text-emerald-700'
                          : isNext
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {step.icon}
                    </div>
                    <span className="font-mono text-xs font-bold text-gray-500">
                      Step 0{step.stepNumber}
                    </span>
                  </div>
                  {getStatusBadge(step.status)}
                </div>

                <div>
                  <div className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                    <span>{step.title}</span>
                  </div>
                  <div className="text-[11px] font-mono text-primary-700 mt-0.5 font-medium">
                    {step.phase}
                  </div>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                {isFinished && step.actionLink ? (
                  <Link
                    to={step.actionLink}
                    className="inline-flex items-center font-medium text-emerald-700 hover:text-emerald-900 transition-colors"
                  >
                    <span>{step.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                ) : isNext ? (
                  <span className="inline-flex items-center font-semibold text-indigo-600">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    <span>Ready for Execution</span>
                  </span>
                ) : (
                  <span className="text-gray-400 font-mono text-[11px]">
                    Upcoming Milestone
                  </span>
                )}
                {isFinished && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Live
                  </span>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ProcessFlowStepper;

