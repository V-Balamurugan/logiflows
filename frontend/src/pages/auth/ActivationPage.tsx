import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { activateApi } from '../../api/auth';
import Logo from '../../components/common/Logo';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';

export const ActivationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasTriggeredRef = useRef<boolean>(false);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      setErrorMessage('No activation token found in verification URL.');
      return;
    }

    if (hasTriggeredRef.current) {
      return;
    }
    hasTriggeredRef.current = true;

    activateApi(token)
      .then((response) => {
        setSuccessMessage(response.message || 'Account activated successfully! You may now sign in.');
      })
      .catch((err) => {
        const detail =
          err.response?.data?.error?.message ||
          err.response?.data?.error?.details ||
          'Activation link is invalid, has expired, or has already been consumed.';
        setErrorMessage(typeof detail === 'string' ? detail : JSON.stringify(detail));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-blue-600 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <Logo size="lg" />
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-white">
          Account Activation
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm shadow-xl p-6 text-center">
          {isLoading ? (
            <div className="py-8 flex flex-col items-center gap-3">
              <Spinner size="lg" />
              <p className="text-sm text-slate-300">Validating activation token...</p>
              <p className="text-xs text-slate-500">Checking cryptographic token authenticity</p>
            </div>
          ) : successMessage ? (
            <div className="py-4 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <CardTitle className="text-xl text-emerald-400">Account Activated!</CardTitle>
              <p className="text-sm text-slate-300">{successMessage}</p>
              <p className="text-xs text-slate-400">
                Your email has been verified. You now have full access to LogiFlows.
              </p>
              <div className="pt-4">
                <Link to="/login">
                  <Button variant="primary" size="md" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Proceed to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="py-4 space-y-4">
              <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
                <XCircle className="w-8 h-8" />
              </div>
              <CardTitle className="text-xl text-rose-400">Activation Failed</CardTitle>
              <p className="text-sm text-slate-300">{errorMessage}</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tokens expire after 24 hours and can only be redeemed once. If you need a new link,
                you may register again or contact support.
              </p>
              <div className="pt-4 flex flex-col gap-2">
                <Link to="/register">
                  <Button variant="secondary" size="md" className="w-full" leftIcon={<RefreshCw className="w-4 h-4" />}>
                    Register Again
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="w-full text-slate-400">
                    Back to Login
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ActivationPage;
