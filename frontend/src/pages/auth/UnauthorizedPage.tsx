import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';

export const UnauthorizedPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-blue-600 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm shadow-xl text-center p-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <CardTitle className="text-2xl text-white">403 - Access Denied</CardTitle>
          <CardDescription className="mt-2 text-slate-300">
            You do not possess the required RBAC role permissions to access this resource.
          </CardDescription>

          <CardContent className="mt-4 text-xs text-slate-400 space-y-3">
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center justify-between">
              <span>Your Current Role:</span>
              <Badge variant="warning">{user?.role || 'ANONYMOUS'}</Badge>
            </div>
            <p className="leading-relaxed">
              LogiFlows enforces strict backend authorization matrices across all tenant, branch,
              and administrative views. Contact your organization administrator if you require elevated privileges.
            </p>
          </CardContent>

          <CardFooter className="mt-6 flex flex-col sm:flex-row gap-3 justify-center border-t border-slate-800/80 pt-4">
            <Link to="/status" className="w-full sm:w-auto">
              <Button variant="primary" size="sm" className="w-full" leftIcon={<Home className="w-4 h-4" />}>
                Go to Dashboard
              </Button>
            </Link>
            <Link to="/" className="w-full sm:w-auto">
              <Button variant="secondary" size="sm" className="w-full" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Platform Overview
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
