import React from 'react';
import clsx from 'clsx';
import { AlertCircle, RotateCcw } from 'lucide-react';
import Button from './Button';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Service Anomaly Detected',
  message,
  onRetry,
  className,
}) => {
  return (
    <div
      role="alert"
      className={clsx(
        'flex flex-col items-center justify-center text-center p-6 rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-200',
        className
      )}
    >
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-rose-900/40 text-rose-400 mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h4 className="text-base font-semibold text-rose-100 mb-1">{title}</h4>
      <p className="text-xs text-rose-300 max-w-sm mb-4">{message}</p>
      {onRetry && (
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          className="border-rose-500/50 text-rose-300 hover:bg-rose-950/50"
        >
          Retry Request
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
