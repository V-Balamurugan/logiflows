import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User as UserIcon, Lock, Shield, CheckCircle2, AlertCircle, Phone, Save, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updateMeApi, changePasswordApi } from '../api/auth';
import {
  profileUpdateSchema,
  ProfileUpdateFormData,
  passwordChangeSchema,
  PasswordChangeFormData,
} from '../lib/validations/auth';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import PasswordStrengthIndicator from '../components/auth/PasswordStrengthIndicator';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Profile Update Form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: isProfileSubmitting },
  } = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      phone: user?.profile?.phone || '',
      avatar_url: user?.profile?.avatar_url || '',
      bio: user?.profile?.bio || '',
    },
  });

  // Password Change Form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    watch: watchPassword,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
  } = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
  });

  const newPasswordValue = watchPassword('new_password');

  const onProfileSubmit = async (data: ProfileUpdateFormData) => {
    setProfileSuccess(null);
    setProfileError(null);
    try {
      const updatedUser = await updateMeApi(data);
      updateUser(updatedUser);
      setProfileSuccess('Profile attributes saved successfully.');
    } catch (err: any) {
      const detail =
        err.response?.data?.error?.message ||
        err.response?.data?.error?.details ||
        'Failed to update profile attributes.';
      setProfileError(typeof detail === 'string' ? detail : JSON.stringify(detail));
    }
  };

  const onPasswordSubmit = async (data: PasswordChangeFormData) => {
    setPasswordSuccess(null);
    setPasswordError(null);
    try {
      const res = await changePasswordApi(data);
      setPasswordSuccess(res.message || 'Password changed successfully.');
      resetPasswordForm();
    } catch (err: any) {
      const detail =
        err.response?.data?.error?.message ||
        err.response?.data?.error?.details?.current_password?.[0] ||
        err.response?.data?.error?.details?.new_password?.[0] ||
        'Failed to change password. Please verify your current password.';
      setPasswordError(typeof detail === 'string' ? detail : JSON.stringify(detail));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Profile Summary */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-900/30 via-slate-900/40 to-slate-900/60 border border-slate-800 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            {user?.first_name ? user.first_name[0].toUpperCase() : user?.email[0].toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-white">{user?.full_name || user?.email}</h1>
              <Badge variant="default">{user?.role || 'CUSTOMER'}</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1">{user?.email}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Account created on {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Profile Details</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'security'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Security & Password</span>
          </button>
        </div>
      </div>

      {activeTab === 'profile' ? (
        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader>
            <CardTitle>Personal & Contact Information</CardTitle>
            <CardDescription>
              Update your personal profile information. Email and Role are managed through administrative policies.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {profileSuccess && (
              <div
                role="status"
                className="mb-5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div
                role="alert"
                className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  type="text"
                  placeholder="First name"
                  error={profileErrors.first_name?.message}
                  {...registerProfile('first_name')}
                />
                <Input
                  label="Last Name"
                  type="text"
                  placeholder="Last name"
                  error={profileErrors.last_name?.message}
                  {...registerProfile('last_name')}
                />
              </div>

              <Input
                label="Phone Number"
                type="tel"
                placeholder="+1 (555) 000-0000"
                leftIcon={<Phone className="w-4 h-4" />}
                error={profileErrors.phone?.message}
                {...registerProfile('phone')}
              />

              <Input
                label="Avatar Image URL (Optional)"
                type="url"
                placeholder="https://example.com/avatar.jpg"
                error={profileErrors.avatar_url?.message}
                {...registerProfile('avatar_url')}
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">Bio / Notes</label>
                <textarea
                  className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 text-sm rounded-lg p-3 transition-colors focus:outline-none focus:ring-1 focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                  placeholder="Tell us about your role or delivery operations..."
                  {...registerProfile('bio')}
                />
                {profileErrors.bio?.message && (
                  <p className="text-xs text-rose-400">{profileErrors.bio.message}</p>
                )}
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isProfileSubmitting}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Update your account password. Requires verification of your current password.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {passwordSuccess && (
              <div
                role="status"
                className="mb-5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div
                role="alert"
                className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4 max-w-xl">
              <Input
                label="Current Password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                leftIcon={<KeyRound className="w-4 h-4" />}
                error={passwordErrors.current_password?.message}
                {...registerPassword('current_password')}
              />

              <div>
                <Input
                  label="New Password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  leftIcon={<Lock className="w-4 h-4" />}
                  error={passwordErrors.new_password?.message}
                  {...registerPassword('new_password')}
                />
                <PasswordStrengthIndicator password={newPasswordValue} />
              </div>

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                leftIcon={<Lock className="w-4 h-4" />}
                error={passwordErrors.confirm_password?.message}
                {...registerPassword('confirm_password')}
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isPasswordSubmitting}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  Update Password
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfilePage;
