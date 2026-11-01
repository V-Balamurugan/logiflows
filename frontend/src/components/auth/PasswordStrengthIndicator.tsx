import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password?: string;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password = '' }) => {
  const criteria = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains a number (0-9)', met: /[0-9]/.test(password) },
    { label: 'Contains uppercase letter (A-Z)', met: /[A-Z]/.test(password) },
    { label: 'Contains special symbol (!@#$%^&*)', met: /[^A-Za-z0-9]/.test(password) },
  ];

  const score = criteria.filter((c) => c.met).length;

  const getStrengthMeta = () => {
    if (!password) return { label: '', color: 'bg-slate-700', text: 'text-slate-500' };
    switch (score) {
      case 0:
      case 1:
        return { label: 'Weak', color: 'bg-rose-500', text: 'text-rose-400' };
      case 2:
        return { label: 'Fair', color: 'bg-amber-500', text: 'text-amber-400' };
      case 3:
        return { label: 'Good', color: 'bg-blue-500', text: 'text-blue-400' };
      case 4:
      default:
        return { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-400' };
    }
  };

  const meta = getStrengthMeta();

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="text-slate-400">Password Strength</span>
        <span className={`font-semibold ${meta.text}`}>{meta.label}</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5 h-1.5">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`h-full rounded-full transition-all duration-300 ${
              step <= score ? meta.color : 'bg-slate-800'
            }`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1 pt-1 text-[11px]">
        {criteria.map((c, i) => (
          <div
            key={i}
            className={`flex items-center gap-1 ${c.met ? 'text-emerald-400' : 'text-slate-500'}`}
          >
            {c.met ? <Check className="w-3 h-3 flex-shrink-0" /> : <X className="w-3 h-3 flex-shrink-0" />}
            <span>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
