import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, Activity } from 'lucide-react';
import Button from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full glass-panel p-8 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
          <Compass className="w-8 h-8 animate-pulse" />
        </div>
        <div className="space-y-2">
          <span className="text-4xl font-extrabold text-blue-500">404</span>
          <h1 className="text-xl font-bold text-slate-100">Page Not Found</h1>
          <p className="text-sm text-slate-400">
            The requested route does not exist in the LogiFlows platform or has not been unlocked in Phase 0.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link to="/">
            <Button variant="primary" size="sm" leftIcon={<Home className="w-4 h-4" />}>
              Return to Home
            </Button>
          </Link>
          <Link to="/app/status">
            <Button variant="secondary" size="sm" leftIcon={<Activity className="w-4 h-4" />}>
              Dev Status Page
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
