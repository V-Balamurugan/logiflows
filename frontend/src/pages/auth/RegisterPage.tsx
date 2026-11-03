import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { registerSchema, RegisterFormData } from '../../lib/validations/auth';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Logo from '../../components/common/Logo';
import PasswordStrengthIndicator from '../../components/auth/PasswordStrengthIndicator';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';

export const RegisterPage: React.FC = () => {
  const { register: registerCustomer } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      first_name: '',
      last_name: '',
      password: '',
      confirm_password: '',
    },
  });

  const passwordValue = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      const response = await registerCustomer(data);
      setRegisteredEmail(response.email || data.email);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error?.message ||
        err.response?.data?.error?.details?.email?.[0] ||
        err.response?.data?.error?.details ||
        'Registration could not be completed. Please try again.';
      setServerError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    }
  };

  if (registeredEmail) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-blue-600 selection:text-white">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm shadow-xl text-center p-6">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl">Check Your Email</CardTitle>
            <p className="mt-2 text-sm text-slate-300">
              We have dispatched a verification email to:
            </p>
            <p className="text-sm font-semibold text-blue-400 mt-1">
              {registeredEmail}
            </p>
            <p className="mt-4 text-xs text-slate-400 leading-relaxed">
              Click the single-use activation link inside to activate your account.
              In local development, emails can be previewed in the Mailpit sink on port 8025.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Link to="/login">
                <Button variant="primary" size="md" className="w-full">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-blue-600 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <Logo size="lg" />
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-white">
          Create Customer Account
        </h2>
        <p className="mt-1 text-center text-sm text-slate-400">
          Join LogiFlows to manage logistics and parcel delivery workflows
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle>Customer Registration</CardTitle>
            <CardDescription>
              New registrations receive strictly CUSTOMER role privileges
            </CardDescription>
          </CardHeader>

          <CardContent>
            {serverError && (
              <div
                role="alert"
                className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                leftIcon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                {...register('email')}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="First Name"
                  type="text"
                  placeholder="Alex"
                  leftIcon={<UserIcon className="w-4 h-4" />}
                  error={errors.first_name?.message}
                  {...register('first_name')}
                />
                <Input
                  label="Last Name"
                  type="text"
                  placeholder="Smith"
                  error={errors.last_name?.message}
                  {...register('last_name')}
                />
              </div>

              <div>
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  leftIcon={<Lock className="w-4 h-4" />}
                  error={errors.password?.message}
                  {...register('password')}
                />
                <PasswordStrengthIndicator password={passwordValue} />
              </div>

              <Input
                label="Confirm Password"
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
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Register Account
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center border-t border-slate-800/80 pt-4">
            <p className="text-xs text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold ml-1">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
