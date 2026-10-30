import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Lock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { passwordResetConfirmSchema, PasswordResetConfirmFormData } from '../../lib/validations/auth';
import { confirmPasswordResetApi } from '../../api/auth';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Logo from '../../components/common/Logo';
import PasswordStrengthIndicator from '../../components/auth/PasswordStrengthIndicator';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PasswordResetConfirmFormData>({
    resolver: zodResolver(passwordResetConfirmSchema),
    defaultValues: {
      token: tokenFromUrl,
      new_password: '',
      confirm_password: '',
    },
  });

  const newPasswordValue = watch('new_password');

  const onSubmit = async (data: PasswordResetConfirmFormData) => {
    setServerError(null);
    try {
      await confirmPasswordResetApi(data);
      setIsSuccess(true);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error?.message ||
        err.response?.data?.error?.details ||
        'Password reset could not be completed. The link may have expired or already been redeemed.';
      setServerError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-blue-600 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <Logo size="lg" />
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-white">
          Create New Password
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle>Set New Password</CardTitle>
            <CardDescription>
              Choose a strong password with at least 8 characters, a digit, and a symbol.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isSuccess ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-white">Password Updated</h3>
                <p className="text-xs text-slate-300">
                  Your password has been successfully reset. You may now sign in using your new credentials.
                </p>
                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full"
                    onClick={() => navigate('/login')}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Sign In Now
                  </Button>
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

                {!tokenFromUrl && (
                  <Input
                    label="Reset Token"
                    type="text"
                    placeholder="Paste token from email"
                    error={errors.token?.message}
                    {...register('token')}
                  />
                )}

                <div>
                  <Input
                    label="New Password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    leftIcon={<Lock className="w-4 h-4" />}
                    error={errors.new_password?.message}
                    {...register('new_password')}
                  />
                  <PasswordStrengthIndicator password={newPasswordValue} />
                </div>

                <Input
                  label="Confirm New Password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  leftIcon={<Lock className="w-4 h-4" />}
                  error={errors.confirm_password?.message}
                  {...register('confirm_password')}
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full mt-4"
                  isLoading={isSubmitting}
                >
                  Save New Password
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex justify-center border-t border-slate-800/80 pt-4">
            <Link to="/login" className="text-xs text-slate-400 hover:text-slate-200 transition-colors">
              Remembered your password? Sign in
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
