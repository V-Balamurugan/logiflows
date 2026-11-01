import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { passwordResetRequestSchema, PasswordResetRequestFormData } from '../../lib/validations/auth';
import { requestPasswordResetApi } from '../../api/auth';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Logo from '../../components/common/Logo';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';

export const ForgotPasswordPage: React.FC = () => {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordResetRequestFormData>({
    resolver: zodResolver(passwordResetRequestSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: PasswordResetRequestFormData) => {
    setServerError(null);
    try {
      await requestPasswordResetApi(data);
      setSubmittedEmail(data.email);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error?.message ||
        'Could not process password reset request. Please try again.';
      setServerError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-blue-600 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <Logo size="lg" />
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-white">
          Reset Password
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle>Forgot Your Password?</CardTitle>
            <CardDescription>
              Enter your email address and we'll dispatch a secure recovery link.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {submittedEmail ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-white">Instructions Dispatched</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  If an account exists matching <strong className="text-blue-400">{submittedEmail}</strong>,
                  you will receive password reset instructions shortly.
                </p>
                <p className="text-[11px] text-slate-500">
                  Be sure to check your spam filter. Links remain valid for 24 hours.
                </p>
                <div className="pt-2">
                  <Link to="/login">
                    <Button variant="secondary" size="md" className="w-full">
                      Return to Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {serverError && (
                  <div
                    role="alert"
                    className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    <span>{serverError}</span>
                  </div>
                )}

                <Input
                  label="Registered Email Address"
                  type="email"
                  placeholder="you@company.com"
                  autoComplete="email"
                  leftIcon={<Mail className="w-4 h-4" />}
                  error={errors.email?.message}
                  {...register('email')}
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full mt-2"
                  isLoading={isSubmitting}
                >
                  Send Reset Link
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex justify-center border-t border-slate-800/80 pt-4">
            <Link
              to="/login"
              className="text-xs text-slate-400 hover:text-slate-200 inline-flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
