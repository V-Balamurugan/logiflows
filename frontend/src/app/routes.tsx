import React from 'react';
import { Route, Routes } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import AppShell from '../components/layout/AppShell';
import ProtectedRoute from '../components/auth/ProtectedRoute';

// Public Pages
import LandingPage from '../pages/LandingPage';
import StatusPage from '../pages/StatusPage';
import DesignSystemPage from '../pages/DesignSystemPage';
import ArchitecturePage from '../pages/ArchitecturePage';
import NotFoundPage from '../pages/NotFoundPage';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ActivationPage from '../pages/auth/ActivationPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import UnauthorizedPage from '../pages/auth/UnauthorizedPage';

// Authenticated Pages
import ProfilePage from '../pages/ProfilePage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Landing Shell */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
      </Route>

      {/* Auth Flows */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/activate" element={<ActivationPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Protected Profile Pages */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppShell>
              <ProfilePage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/profile"
        element={
          <ProtectedRoute>
            <AppShell>
              <ProfilePage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      {/* Primary Telemetry & Design System Views */}
      <Route
        path="/status"
        element={
          <AppShell>
            <StatusPage />
          </AppShell>
        }
      />

      <Route
        path="/design-system"
        element={
          <AppShell>
            <DesignSystemPage />
          </AppShell>
        }
      />

      {/* App Namespace Shortcuts */}
      <Route
        path="/app/status"
        element={
          <AppShell>
            <StatusPage />
          </AppShell>
        }
      />

      <Route
        path="/app/architecture"
        element={
          <AppShell>
            <ArchitecturePage />
          </AppShell>
        }
      />

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
