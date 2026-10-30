import React from 'react';
import clsx from 'clsx';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'teal';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full';

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  const variantStyles = {
    default: 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
    success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
    error: 'bg-rose-500/10 text-rose-400 border border-rose-500/30',
    info: 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
    neutral: 'bg-slate-700/40 text-slate-300 border border-slate-600/30',
    teal: 'bg-teal-500/10 text-teal-400 border border-teal-500/30',
  };

  const dotColors = {
    default: 'bg-blue-400',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    error: 'bg-rose-400',
    info: 'bg-blue-400',
    neutral: 'bg-slate-400',
    teal: 'bg-teal-400',
  };

  return (
    <span className={clsx(baseStyles, sizeStyles[size], variantStyles[variant], className)} {...props}>
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
};

export default Badge;
