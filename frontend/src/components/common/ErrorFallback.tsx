import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Button from '../ui/Button';

export interface ErrorFallbackProps {
  error?: Error | null;
  resetErrorBoundary?: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
      <div className="max-w-md w-full glass-panel p-8 text-center space-y-5 border-rose-500/30">
        <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-100">Application Error Encountered</h2>
          <p className="text-sm text-slate-400">
            A runtime error occurred in the LogiFlows client application. The error state has been isolated.
          </p>
        </div>
        {error?.message && (
          <div className="p-3 bg-slate-950/80 rounded border border-rose-500/20 text-left text-xs font-mono text-rose-300 max-h-32 overflow-y-auto">
            {error.message}
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          {resetErrorBoundary && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<RefreshCw className="w-4 h-4" />}
              onClick={resetErrorBoundary}
            >
              Retry Action
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Home className="w-4 h-4" />}
            onClick={() => window.location.assign('/')}
          >
            Return to Homepage
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ErrorFallback;
